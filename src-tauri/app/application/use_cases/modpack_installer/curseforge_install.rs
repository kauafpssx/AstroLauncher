use std::sync::atomic::Ordering;
use std::sync::Arc;

use crate::application::dto::{AstroPackEventDTO, InstallModpackInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::application::use_cases::suggest_memory_mb;
use crate::application::validation::{validate_required, MAX_INSTANCE_NAME};
use crate::domain::entities::Instance;
use crate::infrastructure::curseforge;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::persistence::config::json_settings_repository;

use super::ModpackInstallerService;

impl ModpackInstallerService {
    pub async fn install_curseforge_modpack(
        &self,
        input: InstallModpackInput,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<InstanceDTO> {
        self.cancelled.store(false, Ordering::SeqCst);
        let instance_name = validate_required(&input.instance_name, MAX_INSTANCE_NAME)
            .map_err(anyhow::Error::msg)?;
        let _presence = self
            .discord
            .guard("Instalando modpack", instance_name.clone());

        let api_key = json_settings_repository::resolve_curseforge_api_key(&self.app_data_dir)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Configure sua API key do CurseForge em Configurações antes de instalar."
                )
            })?;

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

        let mut instance = Instance::new(instance_name, mc_version);
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

        let installed_count = self
            .download_curseforge_files(
                manifest.files.clone(),
                icons_by_project,
                names_by_project,
                api_key,
                mods_dir,
                instance.id.clone(),
                on_event.clone(),
            )
            .await?;

        curseforge::modpack::extract_overrides(&bytes, &manifest.overrides, &instance_dir)?;

        let (min_mb, max_mb) = suggest_memory_mb(installed_count);
        instance.min_memory = min_mb;
        instance.max_memory = max_mb;
        self.instance_repository.save(&instance)?;

        on_event(AstroPackEventDTO::Done {
            instance_id: instance.id.clone(),
        });

        Ok(instance_mapper::to_dto(&instance))
    }
}
