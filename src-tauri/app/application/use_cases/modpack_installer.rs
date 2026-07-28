use std::path::PathBuf;
use std::sync::Arc;

use crate::application::dto::{InstallModpackInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::domain::entities::Instance;
use crate::domain::repositories::InstanceRepository;
use crate::infrastructure::downloader::file_downloader;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::modrinth::mrpack;

pub struct ModpackInstallerService {
    instance_repository: Arc<dyn InstanceRepository>,
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
}

impl ModpackInstallerService {
    pub fn new(instance_repository: Arc<dyn InstanceRepository>, http_client: reqwest::Client, app_data_dir: PathBuf) -> Self {
        Self { instance_repository, http_client, app_data_dir }
    }

    /// Downloads a Modrinth `.mrpack`, derives the Minecraft version/loader
    /// from its `dependencies` block, creates a new instance, downloads every
    /// referenced file and extracts the `overrides/` folder into it.
    pub async fn install_modrinth_modpack(&self, input: InstallModpackInput) -> anyhow::Result<InstanceDTO> {
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
            .find_map(|key| index.dependencies.get(*key).map(|v| (loader_id_for(key), v.clone())))
            .map(|(id, v)| (Some(id), Some(v)))
            .unwrap_or((None, None));

        let mut instance = Instance::new(input.instance_name, mc_version);
        instance.loader = loader;
        instance.loader_version = loader_version;
        instance.folder_id = input.folder_id;
        self.instance_repository.save(&instance)?;

        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        std::fs::create_dir_all(&instance_dir)?;

        for file in &index.files {
            if !file.is_client_supported() {
                continue;
            }
            let Some(url) = file.downloads.first() else { continue };
            let dest = instance_dir.join(&file.path);
            file_downloader::download_to_file(&self.http_client, url, &dest, Some(&file.hashes.sha1)).await?;
        }

        mrpack::extract_overrides(&bytes, &instance_dir)?;

        Ok(instance_mapper::to_dto(&instance))
    }
}

fn loader_id_for(dependency_key: &str) -> String {
    dependency_key.trim_end_matches("-loader").to_string()
}
