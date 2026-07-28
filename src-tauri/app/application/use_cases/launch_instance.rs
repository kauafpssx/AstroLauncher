use std::path::PathBuf;
use std::sync::Arc;

use crate::application::dto::LaunchEventDTO;
use crate::domain::repositories::{AccountRepository, InstanceRepository};
use crate::infrastructure::downloader::progress::{ProgressReporter, ProgressUpdate};
use crate::infrastructure::downloader::{asset_downloader, file_downloader};
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::java;
use crate::infrastructure::minecraft::rules::rules_allow;
use crate::infrastructure::minecraft::{manifest, version_meta};
use crate::infrastructure::modloader::fabric_like;
use crate::infrastructure::process::launcher;
use crate::infrastructure::process::manager::ProcessManager;

/// Fabric/Quilt loader libraries have no advertised size — used only to keep
/// the overall progress bar moving sensibly before they're downloaded.
const ESTIMATED_LOADER_LIBRARY_BYTES: u64 = 300_000;

pub struct LaunchInstanceUseCase {
    instance_repository: Arc<dyn InstanceRepository>,
    account_repository: Arc<dyn AccountRepository>,
    process_manager: Arc<ProcessManager>,
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
}

impl LaunchInstanceUseCase {
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        account_repository: Arc<dyn AccountRepository>,
        process_manager: Arc<ProcessManager>,
        http_client: reqwest::Client,
        app_data_dir: PathBuf,
    ) -> Self {
        Self { instance_repository, account_repository, process_manager, http_client, app_data_dir }
    }

    pub async fn execute(
        &self,
        instance_id: &str,
        on_event: Arc<dyn Fn(LaunchEventDTO) + Send + Sync>,
        on_exit: Arc<dyn Fn(&str) + Send + Sync>,
    ) -> anyhow::Result<()> {
        let result = self.run(instance_id, on_event.clone(), on_exit).await;
        if let Err(err) = &result {
            (*on_event)(LaunchEventDTO::Error { message: err.to_string() });
        }
        result
    }

    async fn run(
        &self,
        instance_id: &str,
        on_event: Arc<dyn Fn(LaunchEventDTO) + Send + Sync>,
        on_exit: Arc<dyn Fn(&str) + Send + Sync>,
    ) -> anyhow::Result<()> {
        let instance = {
            let repository = self.instance_repository.clone();
            let id = instance_id.to_string();
            tokio::task::spawn_blocking(move || repository.find_by_id(&id)).await??
        };

        let account = {
            let repository = self.account_repository.clone();
            let accounts = tokio::task::spawn_blocking(move || repository.find_all()).await??;
            accounts
                .into_iter()
                .find(|a| a.is_default)
                .ok_or_else(|| anyhow::anyhow!("Nenhuma conta configurada. Adicione uma conta antes de iniciar o jogo."))?
        };

        (*on_event)(LaunchEventDTO::Stage { label: "Buscando informações da versão".to_string() });
        let versions = manifest::fetch_manifest(&self.http_client).await?;
        let entry = versions
            .versions
            .iter()
            .find(|v| v.id == instance.version)
            .ok_or_else(|| anyhow::anyhow!("Versão '{}' não encontrada no manifesto", instance.version))?;
        let meta = version_meta::fetch_version_meta(&self.http_client, &entry.url).await?;

        (*on_event)(LaunchEventDTO::Stage { label: "Verificando Java".to_string() });
        let required_major = meta.java_version.as_ref().map(|v| v.major_version).unwrap_or(8);
        let on_event_for_java = on_event.clone();
        let java_bin = java::manager::ensure_java(&self.app_data_dir, required_major, &self.http_client, |label| {
            (*on_event_for_java)(LaunchEventDTO::Stage { label: label.to_string() });
        })
        .await?;

        let loader_profile = match instance.loader.as_deref().and_then(fabric_like::meta_base_for) {
            Some(meta_base) => {
                (*on_event)(LaunchEventDTO::Stage { label: format!("Preparando {}", instance.loader.as_deref().unwrap_or("loader")) });
                let loader_version = match &instance.loader_version {
                    Some(v) => v.clone(),
                    None => fabric_like::fetch_latest_stable_loader_version(&self.http_client, meta_base, &instance.version).await?,
                };
                Some(fabric_like::fetch_profile(&self.http_client, meta_base, &instance.version, &loader_version).await?)
            }
            None => None,
        };

        (*on_event)(LaunchEventDTO::Stage { label: "Calculando downloads".to_string() });
        let (asset_index, asset_index_bytes) = asset_downloader::fetch_asset_index(&self.http_client, &meta.asset_index.url).await?;

        let mut total_bytes = meta.downloads.client.size;
        if let Some(profile) = &loader_profile {
            total_bytes += profile.libraries.len() as u64 * ESTIMATED_LOADER_LIBRARY_BYTES;
        }
        let mut total_library_downloads = 0u64;
        for library in &meta.libraries {
            if !rules_allow(&library.rules) {
                continue;
            }
            if let Some(artifact) = library.downloads.as_ref().and_then(|d| d.artifact.as_ref()) {
                total_bytes += artifact.size;
                total_library_downloads += 1;
            }
        }
        total_bytes += asset_index.objects.values().map(|o| o.size).sum::<u64>();

        let on_event_for_reporter = on_event.clone();
        let reporter = ProgressReporter::new(
            total_bytes,
            Arc::new(move |u: ProgressUpdate| {
                (*on_event_for_reporter)(LaunchEventDTO::Progress {
                    stage: u.stage,
                    current_item: u.current_item,
                    stage_current: u.stage_current,
                    stage_total: u.stage_total,
                    overall_current: u.overall_current,
                    overall_total: u.overall_total,
                });
            }),
        );

        let versions_dir = paths::versions_dir(&self.app_data_dir);
        let libraries_dir = paths::libraries_dir(&self.app_data_dir);
        let assets_dir = paths::assets_dir(&self.app_data_dir);
        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        let natives_dir = instance_dir.join("natives");

        let client_jar = versions_dir.join(&meta.id).join("client.jar");
        file_downloader::download_to_file(&self.http_client, &meta.downloads.client.url, &client_jar, Some(&meta.downloads.client.sha1))
            .await?;
        reporter.report_item("Cliente", "client.jar", meta.downloads.client.size, 1, 1);

        let mut library_paths = Vec::new();
        let mut lib_index = 0u64;
        for library in &meta.libraries {
            if !rules_allow(&library.rules) {
                continue;
            }
            let Some(downloads) = &library.downloads else { continue };

            if let Some(artifact) = &downloads.artifact {
                let dest = launcher::library_path(&libraries_dir, &library.name);
                file_downloader::download_to_file(&self.http_client, &artifact.url, &dest, Some(&artifact.sha1)).await?;
                library_paths.push(dest);
                lib_index += 1;
                reporter.report_item("Bibliotecas", &library.name, artifact.size, lib_index, total_library_downloads);
            }

            if let (Some(natives), Some(classifiers)) = (&library.natives, &downloads.classifiers) {
                if let Some(classifier_key) = natives.get("windows") {
                    if let Some(artifact) = classifiers.get(classifier_key) {
                        let dest = libraries_dir
                            .join("natives")
                            .join(format!("{}-{}.jar", library.name.replace(':', "_"), classifier_key));
                        file_downloader::download_to_file(&self.http_client, &artifact.url, &dest, Some(&artifact.sha1)).await?;
                        launcher::extract_natives(&dest, &natives_dir)?;
                    }
                }
            }
        }

        if let Some(profile) = &loader_profile {
            let total_loader_libs = profile.libraries.len() as u64;
            for (index, library) in profile.libraries.iter().enumerate() {
                let dest = launcher::library_path(&libraries_dir, &library.name);
                let url = fabric_like::library_download_url(library);
                file_downloader::download_to_file(&self.http_client, &url, &dest, None).await?;
                library_paths.push(dest);
                reporter.report_item("Bibliotecas do Loader", &library.name, ESTIMATED_LOADER_LIBRARY_BYTES, index as u64 + 1, total_loader_libs);
            }
        }

        asset_downloader::download_assets(&self.http_client, &asset_index, &asset_index_bytes, &meta.asset_index.id, &assets_dir, &reporter)
            .await?;

        (*on_event)(LaunchEventDTO::Stage { label: "Iniciando jogo".to_string() });
        let main_class = loader_profile.as_ref().map(|p| p.main_class.as_str()).unwrap_or(&meta.main_class);
        let classpath = launcher::build_classpath(&library_paths, &client_jar);
        let log_path = instance_dir.join("logs").join("latest.log");

        let child = launcher::spawn_game(
            launcher::LaunchOptions {
                java_bin: &java_bin,
                client_jar: &client_jar,
                natives_dir: &natives_dir,
                assets_dir: &assets_dir,
                game_dir: &instance_dir,
                version_meta: &meta,
                main_class,
                username: &account.username,
                uuid: &account.uuid,
                min_memory_mb: instance.min_memory,
                max_memory_mb: instance.max_memory,
            },
            &classpath,
            &log_path,
        )?;

        self.process_manager.register(instance.id.clone(), child, on_exit);

        Ok(())
    }
}
