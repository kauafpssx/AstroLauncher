use std::sync::atomic::Ordering;
use std::sync::Arc;

use crate::application::dto::{AstroPackEventDTO, InstallModpackInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
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
        for (i, file) in manifest.files.iter().enumerate() {
            if self.cancelled.load(Ordering::SeqCst) {
                rollback_instance(
                    self.instance_repository.as_ref(),
                    &self.app_data_dir,
                    &instance.id,
                );
                anyhow::bail!("Instalação cancelada");
            }
            let resolved = curseforge::client::get_file(
                &self.http_client,
                &api_key,
                file.project_id,
                file.file_id,
            )
            .await?;
            let icon_url = icons_by_project.get(&file.project_id).cloned().flatten();
            let mod_name = names_by_project
                .get(&file.project_id)
                .cloned()
                .unwrap_or_else(|| resolved.display_name.clone());
            on_event(AstroPackEventDTO::Progress {
                kind: "mod".to_string(),
                name: mod_name.clone(),
                icon_url: icon_url.clone(),
                current: i as u64,
                total,
            });
            let Some(url) = resolved.download_url else {
                continue;
            };
            let dest = mods_dir.join(&resolved.file_name);
            file_downloader::download_to_file(&self.http_client, &url, &dest, None).await?;

            let installed = InstalledMod::new(
                instance.id.clone(),
                file.project_id.to_string(),
                "curseforge".to_string(),
                mod_name,
                resolved.display_name.clone(),
                dest.display().to_string(),
                icon_url,
                "mod".to_string(),
            );
            let _ = self.mod_repository.save(&installed);
        }

        curseforge::modpack::extract_overrides(&bytes, &manifest.overrides, &instance_dir)?;
        on_event(AstroPackEventDTO::Done {
            instance_id: instance.id.clone(),
        });

        Ok(instance_mapper::to_dto(&instance))
    }
}
