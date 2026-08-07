use std::sync::atomic::{AtomicI64, AtomicU64, Ordering};
use std::sync::Arc;

use futures::stream::{self, StreamExt};

use crate::application::dto::{AstroPackEventDTO, InstallModpackInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::application::use_cases::suggest_memory_mb;
use crate::domain::entities::{InstalledMod, Instance};
use crate::infrastructure::downloader::file_downloader;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::filesystem::safe_path::safe_join;
use crate::infrastructure::modrinth::{self, mrpack};

use super::{rollback_instance, ModpackInstallerService};

/// Maps a `.mrpack` file's path prefix to the content kind used by our mod
/// registry: files outside these folders (e.g. `config/`) aren't installed
/// content and shouldn't show up in the mods list.
fn kind_for_mrpack_path(path: &str) -> Option<&'static str> {
    if path.starts_with("mods/") {
        Some("mod")
    } else if path.starts_with("resourcepacks/") {
        Some("resourcepack")
    } else if path.starts_with("shaderpacks/") {
        Some("shader")
    } else {
        None
    }
}

impl ModpackInstallerService {
    /// Downloads a Modrinth `.mrpack`, derives the Minecraft version/loader
    /// from its `dependencies` block, creates a new instance, downloads every
    /// referenced file and extracts the `overrides/` folder into it.
    pub async fn install_modrinth_modpack(
        &self,
        input: InstallModpackInput,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<InstanceDTO> {
        self.cancelled.store(false, Ordering::SeqCst);
        let _presence = self
            .discord
            .guard("Instalando modpack", input.instance_name.clone());

        // Downloading the `.mrpack` itself (overrides can bundle whole
        // resource/shader packs, so it's often several MB on a single
        // connection) plus resolving every file's project metadata below
        // can take a while with nothing to show for it otherwise — this is
        // the only feedback the user gets before the per-file downloads
        // (and their own Progress events) start.
        on_event(AstroPackEventDTO::Progress {
            kind: "mod".to_string(),
            name: "Baixando pacote...".to_string(),
            icon_url: None,
            current: 0,
            total: 0,
        });

        let bytes = self
            .http_client
            .get(&input.download_url)
            .send()
            .await?
            .error_for_status()?
            .bytes()
            .await?
            .to_vec();

        let index = mrpack::read_index(&bytes)?;

        let mc_version = index
            .dependencies
            .get("minecraft")
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("Modpack não especifica uma versão do Minecraft"))?;

        let (loader, loader_version) = ["fabric-loader", "quilt-loader", "forge", "neoforge"]
            .iter()
            .find_map(|key| {
                index
                    .dependencies
                    .get(*key)
                    .map(|v| (loader_id_for(key), v.clone()))
            })
            .map(|(id, v)| (Some(id), Some(v)))
            .unwrap_or((None, None));

        let mut instance = Instance::new(input.instance_name, mc_version);
        instance.loader = loader;
        instance.loader_version = loader_version;
        instance.folder_id = input.folder_id;
        instance.icon_path = self.download_icon(&input.icon_url).await;
        self.instance_repository.save(&instance)?;

        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        std::fs::create_dir_all(&instance_dir)?;

        on_event(AstroPackEventDTO::Progress {
            kind: "mod".to_string(),
            name: "Resolvendo mods...".to_string(),
            icon_url: None,
            current: 0,
            total: 0,
        });

        let downloadable: Vec<_> = index
            .files
            .iter()
            .filter(|f| f.is_client_supported())
            .cloned()
            .collect();

        // Resolve every file's project metadata (name/version/icon) from its
        // hash *before* downloading: the `.mrpack` manifest only lists
        // hashes, and we want icons available for the progress events too,
        // not just after the fact.
        let hashes: Vec<String> = downloadable.iter().map(|f| f.hashes.sha1.clone()).collect();
        let versions_by_hash = modrinth::client::get_versions_by_hashes(&self.http_client, &hashes)
            .await
            .unwrap_or_default();
        let project_ids: Vec<String> = {
            let mut ids: Vec<String> = versions_by_hash
                .values()
                .map(|v| v.project_id.clone())
                .collect();
            ids.sort_unstable();
            ids.dedup();
            ids
        };
        let mut icons_by_project: std::collections::HashMap<String, Option<String>> =
            std::collections::HashMap::new();
        let mut titles_by_project: std::collections::HashMap<String, String> =
            std::collections::HashMap::new();
        for project in modrinth::client::get_projects_by_ids(&self.http_client, &project_ids)
            .await
            .unwrap_or_default()
        {
            icons_by_project.insert(project.id.clone(), project.icon_url);
            titles_by_project.insert(project.id, project.title);
        }

        let total = downloadable.len() as u64;
        let done = Arc::new(AtomicU64::new(0));
        let installed_count = Arc::new(AtomicI64::new(0));
        let results: Vec<anyhow::Result<()>> = stream::iter(downloadable)
            .map(|file| {
                let client = self.http_client.clone();
                let mod_repository = self.mod_repository.clone();
                let instance_dir = instance_dir.clone();
                let instance_id = instance.id.clone();
                let on_event = on_event.clone();
                let cancelled = self.cancelled.clone();
                let done = done.clone();
                let installed_count = installed_count.clone();
                let version = versions_by_hash.get(&file.hashes.sha1).cloned();
                let icon_url = version
                    .as_ref()
                    .and_then(|v| icons_by_project.get(&v.project_id).cloned().flatten());
                let name = version
                    .as_ref()
                    .and_then(|v| titles_by_project.get(&v.project_id).cloned())
                    .or_else(|| version.as_ref().map(|v| v.name.clone()))
                    .unwrap_or_else(|| {
                        file.path
                            .rsplit('/')
                            .next()
                            .unwrap_or(&file.path)
                            .to_string()
                    });
                async move {
                    if cancelled.load(Ordering::SeqCst) {
                        anyhow::bail!("Instalação cancelada");
                    }
                    let Some(url) = file.downloads.first() else {
                        return Ok(());
                    };
                    // `file.path` comes from the untrusted `.mrpack` index:
                    // reject any `..`/absolute path that would escape the
                    // instance dir.
                    let Some(dest) = safe_join(&instance_dir, &file.path) else {
                        return Ok(());
                    };
                    file_downloader::download_to_file(&client, url, &dest, Some(&file.hashes.sha1))
                        .await?;

                    let current = done.fetch_add(1, Ordering::Relaxed) + 1;
                    on_event(AstroPackEventDTO::Progress {
                        kind: "mod".to_string(),
                        name: name.clone(),
                        icon_url: icon_url.clone(),
                        current,
                        total,
                    });

                    // `name` is already "title, else version name" whenever
                    // `version` is `Some` — the only extra fallback it has
                    // (the raw filename) only kicks in when `version` is
                    // `None`, i.e. exactly the case this branch excludes.
                    if let (Some(kind), Some(version)) = (kind_for_mrpack_path(&file.path), version)
                    {
                        let installed = InstalledMod::new(
                            instance_id,
                            version.project_id,
                            "modrinth".to_string(),
                            name,
                            version.version_number,
                            dest.display().to_string(),
                            icon_url,
                            kind.to_string(),
                        );
                        if mod_repository.save(&installed).is_ok() {
                            installed_count.fetch_add(1, Ordering::Relaxed);
                        }
                    }
                    Ok(())
                }
            })
            .buffer_unordered(super::FILE_CONCURRENCY)
            .collect()
            .await;

        if results.iter().any(|r| r.is_err()) {
            rollback_instance(
                self.instance_repository.as_ref(),
                &self.app_data_dir,
                &instance.id,
            );
            for result in results {
                result?;
            }
        }

        mrpack::extract_overrides(&bytes, &instance_dir)?;

        let (min_mb, max_mb) = suggest_memory_mb(installed_count.load(Ordering::Relaxed));
        instance.min_memory = min_mb;
        instance.max_memory = max_mb;
        self.instance_repository.save(&instance)?;

        on_event(AstroPackEventDTO::Done {
            instance_id: instance.id.clone(),
        });

        Ok(instance_mapper::to_dto(&instance))
    }
}

fn loader_id_for(dependency_key: &str) -> String {
    dependency_key.trim_end_matches("-loader").to_string()
}
