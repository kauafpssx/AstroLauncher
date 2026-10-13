use std::sync::atomic::Ordering;
use std::sync::Arc;

use crate::application::dto::{AstroPackEventDTO, InstallModpackInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::application::use_cases::suggest_memory_mb;
use crate::application::validation::{validate_required, MAX_INSTANCE_NAME};
use crate::domain::entities::Instance;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::modrinth::{self, mrpack};

use super::ModpackInstallerService;

impl ModpackInstallerService {
    pub async fn install_modrinth_modpack(
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

        let mut instance = Instance::new(instance_name, mc_version);
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

        let installed_count = self
            .download_modrinth_files(
                downloadable,
                versions_by_hash,
                icons_by_project,
                titles_by_project,
                instance_dir.clone(),
                instance.id.clone(),
                on_event.clone(),
            )
            .await?;

        mrpack::extract_overrides(&bytes, &instance_dir)?;

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

fn loader_id_for(dependency_key: &str) -> String {
    dependency_key.trim_end_matches("-loader").to_string()
}
