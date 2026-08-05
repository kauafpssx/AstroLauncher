use std::path::PathBuf;
use std::sync::Arc;

use crate::application::dto::{AstroPackManifest, ExportSummaryDTO};
use crate::domain::repositories::{InstanceRepository, ModRepository};
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::minecraft::servers_dat;

use self::helpers::{count_dirs, count_files, read_manifest_json};

mod astropack_export;
mod astropack_import;
mod content;
mod helpers;

pub struct AstroPackService {
    instance_repository: Arc<dyn InstanceRepository>,
    mod_repository: Arc<dyn ModRepository>,
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
}

impl AstroPackService {
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        mod_repository: Arc<dyn ModRepository>,
        http_client: reqwest::Client,
        app_data_dir: PathBuf,
    ) -> Self {
        Self {
            instance_repository,
            mod_repository,
            http_client,
            app_data_dir,
        }
    }

    pub fn preview(&self, file_path: &str) -> anyhow::Result<AstroPackManifest> {
        let file = std::fs::File::open(file_path)?;
        let mut archive = zip::ZipArchive::new(file)?;
        let manifest_json = read_manifest_json(&mut archive)?;
        Ok(serde_json::from_str(&manifest_json)?)
    }

    pub fn get_export_summary(&self, instance_id: &str) -> anyhow::Result<ExportSummaryDTO> {
        let mods = self.mod_repository.find_by_instance(instance_id)?;
        let enabled: Vec<_> = mods.into_iter().filter(|m| m.enabled).collect();
        let instance_dir = paths::instance_dir(&self.app_data_dir, instance_id);

        Ok(ExportSummaryDTO {
            mods: enabled.iter().filter(|m| m.kind == "mod").count(),
            resourcepacks: enabled.iter().filter(|m| m.kind == "resourcepack").count(),
            shaders: enabled.iter().filter(|m| m.kind == "shader").count(),
            worlds: count_dirs(&instance_dir.join("saves")),
            has_notes: instance_dir.join("notes").exists()
                || instance_dir.join("notes.txt").exists(),
            has_settings: instance_dir.join("options.txt").exists(),
            servers: servers_dat::read_servers(&instance_dir.join("servers.dat"))
                .map(|s| s.len())
                .unwrap_or(0),
            screenshots: count_files(&instance_dir.join("screenshots"), "png"),
        })
    }
}
