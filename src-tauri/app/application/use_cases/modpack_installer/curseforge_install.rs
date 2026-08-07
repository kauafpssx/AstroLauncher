use std::sync::atomic::{AtomicI64, AtomicU64, Ordering};
use std::sync::Arc;

use futures::stream::{self, StreamExt};

use crate::application::dto::{AstroPackEventDTO, InstallModpackInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::application::use_cases::suggest_memory_mb;
use crate::domain::entities::{InstalledMod, Instance};
use crate::infrastructure::curseforge;
use crate::infrastructure::downloader::file_downloader;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::persistence::config::json_settings_repository;

use super::{rollback_instance, ModpackInstallerService};

impl ModpackInstallerService {
    /// Downloads a CurseForge modpack zip, derives the Minecraft
    /// version/loader from its `manifest.json`, creates a new instance,
    /// resolves and downloads every referenced mod file, and extracts the
    /// `overrides` folder into it.
    pub async fn install_curseforge_modpack(
        &self,
        input: InstallModpackInput,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<InstanceDTO> {
        self.cancelled.store(false, Ordering::SeqCst);
        let _presence = self
            .discord
            .guard("Instalando modpack", input.instance_name.clone());

        let api_key = json_settings_repository::resolve_curseforge_api_key(&self.app_data_dir)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Configure sua API key do CurseForge em Configurações antes de instalar."
                )
            })?;

        // Downloading the modpack zip itself (overrides can bundle whole
        // resource/shader packs, so it's often several MB on a single
        // connection) plus resolving every mod's metadata below can take a
        // while with nothing to show for it otherwise — this is the only
        // feedback the user gets before the per-file downloads (and their
        // own Progress events) start.
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

        let manifest = curseforge::modpack::read_manifest(&bytes)?;

        let mc_version = manifest.minecraft.version.clone();
        let (loader, loader_version) = manifest
            .minecraft
            .mod_loaders
            .iter()
            .find(|l| l.primary)
            .or_else(|| manifest.minecraft.mod_loaders.first())
            .and_then(|l| curseforge::modpack::parse_loader_id(&l.id))
            .map(|(id, v)| (Some(id), Some(v)))
            .unwrap_or((None, None));

        let mut instance = Instance::new(input.instance_name, mc_version);
        instance.loader = loader;
        instance.loader_version = loader_version;
        instance.folder_id = input.folder_id;
        instance.icon_path = self.download_icon(&input.icon_url).await;
        self.instance_repository.save(&instance)?;

        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        let mods_dir = instance_dir.join("mods");
        std::fs::create_dir_all(&mods_dir)?;

        on_event(AstroPackEventDTO::Progress {
            kind: "mod".to_string(),
            name: "Resolvendo mods...".to_string(),
            icon_url: None,
            current: 0,
            total: 0,
        });

        let project_ids: Vec<u32> = {
            let mut ids: Vec<u32> = manifest.files.iter().map(|f| f.project_id).collect();
            ids.sort_unstable();
            ids.dedup();
            ids
        };
        let mut icons_by_project: std::collections::HashMap<u32, Option<String>> =
            std::collections::HashMap::new();
        let mut names_by_project: std::collections::HashMap<u32, String> =
            std::collections::HashMap::new();
        for entry in curseforge::client::get_mods_by_ids(&self.http_client, &api_key, &project_ids)
            .await
            .unwrap_or_default()
        {
            icons_by_project.insert(entry.id, entry.logo.map(|l| l.url));
            names_by_project.insert(entry.id, entry.name);
        }

        let total = manifest.files.len() as u64;
        let done = Arc::new(AtomicU64::new(0));
        let installed_count = Arc::new(AtomicI64::new(0));
        let results: Vec<anyhow::Result<()>> = stream::iter(manifest.files.clone())
            .map(|file| {
                let client = self.http_client.clone();
                let api_key = api_key.clone();
                let mod_repository = self.mod_repository.clone();
                let mods_dir = mods_dir.clone();
                let instance_id = instance.id.clone();
                let on_event = on_event.clone();
                let cancelled = self.cancelled.clone();
                let done = done.clone();
                let installed_count = installed_count.clone();
                let icon_url = icons_by_project.get(&file.project_id).cloned().flatten();
                let fallback_name = names_by_project.get(&file.project_id).cloned();
                async move {
                    if cancelled.load(Ordering::SeqCst) {
                        anyhow::bail!("Instalação cancelada");
                    }
                    let resolved = curseforge::client::get_file(
                        &client,
                        &api_key,
                        file.project_id,
                        file.file_id,
                    )
                    .await?;
                    let mod_name = fallback_name.unwrap_or_else(|| resolved.display_name.clone());

                    let Some(url) = resolved.download_url else {
                        return Ok(());
                    };
                    let dest = mods_dir.join(&resolved.file_name);
                    file_downloader::download_to_file(&client, &url, &dest, None).await?;

                    // Reported after the file actually lands on disk, not
                    // when we merely resolved its metadata: progress (and
                    // the "installed files" list in the UI) should reflect
                    // completed downloads, not downloads-in-progress.
                    let current = done.fetch_add(1, Ordering::Relaxed) + 1;
                    on_event(AstroPackEventDTO::Progress {
                        kind: "mod".to_string(),
                        name: mod_name.clone(),
                        icon_url: icon_url.clone(),
                        current,
                        total,
                    });

                    let installed = InstalledMod::new(
                        instance_id,
                        file.project_id.to_string(),
                        "curseforge".to_string(),
                        mod_name,
                        resolved.display_name,
                        dest.display().to_string(),
                        icon_url,
                        "mod".to_string(),
                    );
                    match mod_repository.save(&installed) {
                        Ok(()) => {
                            installed_count.fetch_add(1, Ordering::Relaxed);
                        }
                        Err(err) => {
                            tracing::warn!("failed to persist installed mod record: {err}");
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

        curseforge::modpack::extract_overrides(&bytes, &manifest.overrides, &instance_dir)?;

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
