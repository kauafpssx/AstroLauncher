use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;

use futures::stream::{self, StreamExt};

use crate::application::dto::LaunchEventDTO;
use crate::application::use_cases::PlaytimeService;
use crate::domain::repositories::{AccountRepository, InstanceRepository, ModRepository};
use crate::infrastructure::discord::DiscordRpcHandle;
use crate::infrastructure::downloader::progress::{ProgressReporter, ProgressUpdate};
use crate::infrastructure::downloader::{asset_downloader, file_downloader};
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::java;
use crate::infrastructure::minecraft::language as minecraft_language;
use crate::infrastructure::minecraft::rules::rules_allow;
use crate::infrastructure::minecraft::{manifest, version_meta};
use crate::infrastructure::modloader::profile::library_download_url;
use crate::infrastructure::modloader::{fabric_like, forge_like, liteloader};
use crate::infrastructure::process::launcher;
use crate::infrastructure::process::manager::ProcessManager;

/// Fabric/Quilt/LiteLoader libraries have no advertised size: used only to
/// keep the overall progress bar moving sensibly before they're downloaded.
const ESTIMATED_LOADER_LIBRARY_BYTES: u64 = 300_000;

/// Library downloads hit Mojang/Forge/NeoForge Maven repos in parallel
/// instead of one at a time — moderate concurrency, unlike
/// `asset_downloader`'s 16 (thousands of tiny asset files vs. dozens of
/// jars), so it stays polite to Maven-style hosts.
const LIBRARY_CONCURRENCY: usize = 8;

pub struct LaunchInstanceUseCase {
    instance_repository: Arc<dyn InstanceRepository>,
    account_repository: Arc<dyn AccountRepository>,
    mod_repository: Arc<dyn ModRepository>,
    playtime_service: Arc<PlaytimeService>,
    discord: DiscordRpcHandle,
    process_manager: Arc<ProcessManager>,
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
    /// Only one launch preparation runs from the UI at a time, so a single
    /// shared flag is enough to signal cancellation into whichever download
    /// step is currently running. Once Forge/NeoForge's own installer starts
    /// (a blocking third-party call we don't control), cancellation can no
    /// longer interrupt it: the flag only stops things before that point.
    cancelled: Arc<AtomicBool>,
}

impl LaunchInstanceUseCase {
    // Construtor de injeção de dependências: muitos parâmetros é esperado aqui.
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        account_repository: Arc<dyn AccountRepository>,
        mod_repository: Arc<dyn ModRepository>,
        playtime_service: Arc<PlaytimeService>,
        discord: DiscordRpcHandle,
        process_manager: Arc<ProcessManager>,
        http_client: reqwest::Client,
        app_data_dir: PathBuf,
    ) -> Self {
        Self {
            instance_repository,
            account_repository,
            mod_repository,
            playtime_service,
            discord,
            process_manager,
            http_client,
            app_data_dir,
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Signals the currently-running launch preparation (if any) to stop
    /// before its next checkpoint.
    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    fn check_cancelled(&self) -> anyhow::Result<()> {
        if self.cancelled.load(Ordering::SeqCst) {
            anyhow::bail!("Inicialização cancelada");
        }
        Ok(())
    }

    pub async fn execute(
        &self,
        instance_id: &str,
        on_event: Arc<dyn Fn(LaunchEventDTO) + Send + Sync>,
        on_exit: Arc<dyn Fn(&str) + Send + Sync>,
    ) -> anyhow::Result<()> {
        self.cancelled.store(false, Ordering::SeqCst);
        let result = self.run(instance_id, on_event.clone(), on_exit).await;
        if let Err(err) = &result {
            (*on_event)(LaunchEventDTO::Error {
                message: err.to_string(),
            });
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
            accounts.into_iter().find(|a| a.is_default).ok_or_else(|| {
                anyhow::anyhow!(
                    "Nenhuma conta configurada. Adicione uma conta antes de iniciar o jogo."
                )
            })?
        };

        self.check_cancelled()?;
        (*on_event)(LaunchEventDTO::Stage {
            label: "Buscando informações da versão".to_string(),
        });
        let versions = manifest::fetch_manifest(&self.http_client).await?;
        let entry = versions
            .versions
            .iter()
            .find(|v| v.id == instance.version)
            .ok_or_else(|| {
                anyhow::anyhow!("Versão '{}' não encontrada no manifesto", instance.version)
            })?;
        let meta = version_meta::fetch_version_meta(&self.http_client, &entry.url).await?;

        self.check_cancelled()?;
        (*on_event)(LaunchEventDTO::Stage {
            label: "Verificando Java".to_string(),
        });
        let required_major = meta
            .java_version
            .as_ref()
            .map(|v| v.major_version)
            .unwrap_or(8);
        let on_event_for_java = on_event.clone();
        let java_bin = java::manager::ensure_java(
            &self.app_data_dir,
            required_major,
            &self.http_client,
            |label| {
                (*on_event_for_java)(LaunchEventDTO::Stage {
                    label: label.to_string(),
                });
            },
        )
        .await?;

        self.check_cancelled()?;
        if instance
            .loader
            .as_deref()
            .is_some_and(forge_like::is_supported)
        {
            return self
                .run_forge_like(&instance, &account, &java_bin, on_event, on_exit)
                .await;
        }

        let loader_profile = match instance.loader.as_deref() {
            Some(loader) if fabric_like::meta_base_for(loader).is_some() => {
                let meta_base = fabric_like::meta_base_for(loader).unwrap();
                (*on_event)(LaunchEventDTO::Stage {
                    label: format!("Preparando {loader}"),
                });
                let loader_version = match &instance.loader_version {
                    Some(v) => v.clone(),
                    None => {
                        fabric_like::fetch_latest_stable_loader_version(
                            &self.http_client,
                            meta_base,
                            &instance.version,
                        )
                        .await?
                    }
                };
                Some(
                    fabric_like::fetch_profile(
                        &self.http_client,
                        meta_base,
                        &instance.version,
                        &loader_version,
                    )
                    .await?,
                )
            }
            Some("liteloader") => {
                (*on_event)(LaunchEventDTO::Stage {
                    label: "Preparando LiteLoader".to_string(),
                });
                Some(liteloader::fetch_profile(&self.http_client, &instance.version).await?)
            }
            _ => None,
        };

        (*on_event)(LaunchEventDTO::Stage {
            label: "Calculando downloads".to_string(),
        });
        let (asset_index, asset_index_bytes) =
            asset_downloader::fetch_asset_index(&self.http_client, &meta.asset_index.url).await?;

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
        file_downloader::download_to_file(
            &self.http_client,
            &meta.downloads.client.url,
            &client_jar,
            Some(&meta.downloads.client.sha1),
        )
        .await?;
        reporter.report_item("Cliente", "client.jar", meta.downloads.client.size, 1, 1);

        self.check_cancelled()?;
        let lib_done = Arc::new(AtomicU64::new(0));
        let downloadable_libraries: Vec<_> = meta
            .libraries
            .iter()
            .filter(|library| rules_allow(&library.rules))
            .filter_map(|library| library.downloads.clone().map(|d| (library.clone(), d)))
            .collect();
        let lib_results: Vec<anyhow::Result<Option<PathBuf>>> =
            stream::iter(downloadable_libraries)
                .map(|(library, downloads)| {
                    let client = self.http_client.clone();
                    let libraries_dir = libraries_dir.clone();
                    let natives_dir = natives_dir.clone();
                    let reporter = reporter.clone();
                    let cancelled = self.cancelled.clone();
                    let lib_done = lib_done.clone();
                    async move {
                        if cancelled.load(Ordering::SeqCst) {
                            anyhow::bail!("Inicialização cancelada");
                        }
                        let mut path = None;
                        if let Some(artifact) = &downloads.artifact {
                            let dest = launcher::library_path(&libraries_dir, &library.name);
                            file_downloader::download_to_file(
                                &client,
                                &artifact.url,
                                &dest,
                                Some(&artifact.sha1),
                            )
                            .await?;
                            let done = lib_done.fetch_add(1, Ordering::Relaxed) + 1;
                            reporter.report_item(
                                "Bibliotecas",
                                &library.name,
                                artifact.size,
                                done,
                                total_library_downloads,
                            );
                            path = Some(dest);
                        }

                        if let (Some(natives), Some(classifiers)) =
                            (&library.natives, &downloads.classifiers)
                        {
                            if let Some(classifier_key) = natives.get("windows") {
                                if let Some(artifact) = classifiers.get(classifier_key) {
                                    let dest = libraries_dir.join("natives").join(format!(
                                        "{}-{}.jar",
                                        library.name.replace(':', "_"),
                                        classifier_key
                                    ));
                                    file_downloader::download_to_file(
                                        &client,
                                        &artifact.url,
                                        &dest,
                                        Some(&artifact.sha1),
                                    )
                                    .await?;
                                    launcher::extract_natives(&dest, &natives_dir)?;
                                }
                            }
                        }
                        Ok(path)
                    }
                })
                // `buffered` (not `buffer_unordered`): still downloads up to
                // LIBRARY_CONCURRENCY at once, but yields results in input
                // order — `library_paths` feeds `build_classpath` below, and
                // an out-of-order classpath is a real (if usually silent)
                // correctness risk when libraries have overlapping packages.
                .buffered(LIBRARY_CONCURRENCY)
                .collect()
                .await;

        let mut library_paths = Vec::new();
        for result in lib_results {
            if let Some(path) = result? {
                library_paths.push(path);
            }
        }

        if let Some(profile) = &loader_profile {
            self.check_cancelled()?;
            let total_loader_libs = profile.libraries.len() as u64;
            let loader_done = Arc::new(AtomicU64::new(0));
            let loader_results: Vec<anyhow::Result<PathBuf>> =
                stream::iter(profile.libraries.clone())
                    .map(|library| {
                        let client = self.http_client.clone();
                        let libraries_dir = libraries_dir.clone();
                        let reporter = reporter.clone();
                        let cancelled = self.cancelled.clone();
                        let loader_done = loader_done.clone();
                        async move {
                            if cancelled.load(Ordering::SeqCst) {
                                anyhow::bail!("Inicialização cancelada");
                            }
                            let dest = launcher::library_path(&libraries_dir, &library.name);
                            let url = library_download_url(&library);
                            file_downloader::download_to_file(&client, &url, &dest, None).await?;
                            let done = loader_done.fetch_add(1, Ordering::Relaxed) + 1;
                            reporter.report_item(
                                "Bibliotecas do Loader",
                                &library.name,
                                ESTIMATED_LOADER_LIBRARY_BYTES,
                                done,
                                total_loader_libs,
                            );
                            Ok(dest)
                        }
                    })
                    .buffered(LIBRARY_CONCURRENCY)
                    .collect()
                    .await;

            for result in loader_results {
                library_paths.push(result?);
            }
        }

        self.check_cancelled()?;
        asset_downloader::download_assets(
            &self.http_client,
            &asset_index,
            &asset_index_bytes,
            &meta.asset_index.id,
            &assets_dir,
            &self.cancelled,
            &reporter,
        )
        .await?;

        self.check_cancelled()?;
        minecraft_language::ensure_default_language(&instance_dir);
        (*on_event)(LaunchEventDTO::Stage {
            label: "Iniciando jogo".to_string(),
        });
        let main_class = loader_profile
            .as_ref()
            .map(|p| p.main_class.as_str())
            .unwrap_or(&meta.main_class);
        let no_extra_args: Vec<String> = Vec::new();
        let extra_game_args = loader_profile
            .as_ref()
            .map(|p| &p.extra_game_args)
            .unwrap_or(&no_extra_args);
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
                extra_jvm_args: &no_extra_args,
                extra_game_args,
            },
            &classpath,
            &log_path,
        )?;

        self.register_with_playtime(instance.id.clone(), instance.name.clone(), child, on_exit)
            .await;

        Ok(())
    }

    /// Registers the spawned process, wraps `on_exit` so the playtime
    /// session opened for this launch is closed (and the instance total
    /// updated) when the game exits, and updates Discord Rich Presence for
    /// the session's duration. Both are best-effort: a failure must never
    /// prevent the game from launching.
    async fn register_with_playtime(
        &self,
        instance_id: String,
        instance_name: String,
        child: std::process::Child,
        on_exit: Arc<dyn Fn(&str) + Send + Sync>,
    ) {
        let mod_count = {
            let repository = self.mod_repository.clone();
            let id = instance_id.clone();
            tokio::task::spawn_blocking(move || repository.find_by_instance(&id))
                .await
                .ok()
                .and_then(|r| r.ok())
                .map(|mods| mods.len())
                .unwrap_or(0)
        };

        let session_id = {
            let service = self.playtime_service.clone();
            let id = instance_id.clone();
            match tokio::task::spawn_blocking(move || service.start_session(&id)).await {
                Ok(Ok(session)) => Some(session.id),
                Ok(Err(err)) => {
                    tracing::warn!("could not start playtime session for {instance_id}: {err}");
                    None
                }
                Err(err) => {
                    tracing::warn!("playtime session task failed for {instance_id}: {err}");
                    None
                }
            }
        };

        let on_exit = match session_id {
            Some(session_id) => {
                let service = self.playtime_service.clone();
                let original = on_exit.clone();
                Arc::new(move |id: &str| {
                    if let Err(err) = service.end_session(&session_id) {
                        tracing::warn!("could not end playtime session {session_id}: {err}");
                    }
                    (*original)(id);
                })
            }
            None => on_exit,
        };

        let discord = self.discord.clone();
        discord.set_playing(instance_name, mod_count, chrono::Utc::now().timestamp());
        let discord_for_exit = discord.clone();
        let on_exit = Arc::new(move |id: &str| {
            discord_for_exit.set_idle();
            (*on_exit)(id);
        });

        self.process_manager.register(instance_id, child, on_exit);
    }

    /// Forge/NeoForge: the installer, library/asset downloads, and final
    /// command are all delegated to `mc-launcher-core` (see
    /// `infrastructure::modloader::forge_like`) since the modern installer
    /// runs its own binary-patch processors: something worth reusing rather
    /// than reimplementing. The crate's API is synchronous, so the whole
    /// sequence runs inside one `spawn_blocking`.
    async fn run_forge_like(
        &self,
        instance: &crate::domain::entities::Instance,
        account: &crate::domain::entities::Account,
        java_bin: &str,
        on_event: Arc<dyn Fn(LaunchEventDTO) + Send + Sync>,
        on_exit: Arc<dyn Fn(&str) + Send + Sync>,
    ) -> anyhow::Result<()> {
        let loader = instance.loader.clone().unwrap();
        let mc_version = instance.version.clone();
        let requested_version = instance.loader_version.clone();
        let app_data_dir = self.app_data_dir.clone();
        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        let natives_dir = instance_dir.join("natives");
        let java_bin_path: PathBuf = java_bin.into();
        let username = account.username.clone();
        let uuid = account.uuid.clone();
        let on_event_blocking = on_event.clone();
        let instance_dir_for_build = instance_dir.clone();

        let command =
            tokio::task::spawn_blocking(move || -> anyhow::Result<forge_like::BuiltCommand> {
                (*on_event_blocking)(LaunchEventDTO::Stage {
                    label: format!("Preparando {loader}"),
                });
                let loader_version = match requested_version {
                    Some(v) => v,
                    None => forge_like::resolve_loader_version(&loader, &mc_version)?,
                };
                // Modpack manifests store Forge versions without the Minecraft
                // prefix (`47.4.10`); the Maven artifact requires the full
                // `<mc>-<forge>` id or the installer download 404s.
                let loader_version =
                    forge_like::normalize_loader_version(&loader, &mc_version, &loader_version);

                forge_like::ensure_vanilla_json_on_disk(&app_data_dir, &mc_version)?;

                (*on_event_blocking)(LaunchEventDTO::Stage {
                    label: format!("Baixando instalador do {loader}"),
                });
                let url = forge_like::installer_url(&loader, &loader_version)?;
                let installer_path =
                    forge_like::download_installer(&app_data_dir, &loader, &loader_version, &url)?;

                (*on_event_blocking)(LaunchEventDTO::Stage {
                    label: format!("Instalando {loader} (isso pode levar um tempo)"),
                });
                forge_like::ensure_launcher_profile_stub(&app_data_dir)?;
                forge_like::run_installer(&java_bin_path, &installer_path, &app_data_dir, &loader)?;

                let version_id =
                    forge_like::installed_version_id(&loader, &mc_version, &loader_version)?;
                let merged = forge_like::load_merged_version(&app_data_dir, &version_id)?;

                (*on_event_blocking)(LaunchEventDTO::Stage {
                    label: "Baixando bibliotecas e assets".to_string(),
                });
                let on_event_files = on_event_blocking.clone();
                let libraries_total = merged.libraries.len() as u64;
                let mut libraries_done = 0u64;
                // `install_version_files` never actually emits `StageStarted`
                // (verified against the crate source) — gating on a "current
                // stage" that never changes from its initial value would
                // silently sweep every task (including the thousands of
                // asset files) into the "library" bucket. Classify by the
                // task's own destination path instead, captured at
                // `TaskStarted` and looked up when it finishes (`TaskFinished`
                // only carries the label, not the path).
                let mut task_paths: std::collections::HashMap<String, std::path::PathBuf> =
                    std::collections::HashMap::new();
                forge_like::install_files(&merged, &app_data_dir, move |event| {
                    use mc_launcher_core::progress::ProgressEvent;
                    match event {
                        ProgressEvent::TaskStarted { label, path } => {
                            task_paths.insert(label, path);
                        }
                        ProgressEvent::TaskFinished { label }
                        | ProgressEvent::TaskSkipped { label, .. } => {
                            let is_library = task_paths.remove(&label).is_some_and(|p| {
                                p.components().any(|c| c.as_os_str() == "libraries")
                            });
                            if is_library {
                                libraries_done = (libraries_done + 1).min(libraries_total.max(1));
                                (*on_event_files)(LaunchEventDTO::Progress {
                                    stage: "Baixando bibliotecas".to_string(),
                                    current_item: label,
                                    stage_current: libraries_done,
                                    stage_total: libraries_total.max(1),
                                    overall_current: libraries_done,
                                    overall_total: libraries_total.max(1),
                                });
                            }
                        }
                        // Never actually emitted by `install_version_files`
                        // (see comment above), but still part of the enum.
                        ProgressEvent::StageStarted { .. }
                        | ProgressEvent::BytesReceived { .. } => {}
                    }
                })?;

                (*on_event_blocking)(LaunchEventDTO::Stage {
                    label: "Montando comando de inicialização".to_string(),
                });
                forge_like::build_command(
                    &app_data_dir,
                    &merged,
                    &java_bin_path,
                    &instance_dir_for_build,
                    &natives_dir,
                    &username,
                    &uuid,
                )
            })
            .await??;

        minecraft_language::ensure_default_language(&instance_dir);
        (*on_event)(LaunchEventDTO::Stage {
            label: "Iniciando jogo".to_string(),
        });
        let log_path = instance_dir.join("logs").join("latest.log");
        let child = launcher::spawn_with_parts(
            &command.executable,
            &command.args,
            &command.working_dir,
            &log_path,
        )?;
        self.register_with_playtime(instance.id.clone(), instance.name.clone(), child, on_exit)
            .await;
        Ok(())
    }
}
