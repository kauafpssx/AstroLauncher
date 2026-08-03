use std::path::PathBuf;
use std::sync::Arc;

use crate::application::dto::{InstallCustomModInput, InstallModInput, InstalledModDTO};
use crate::domain::entities::InstalledMod;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::{InstanceRepository, ModRepository};
use crate::infrastructure::discord::DiscordRpcHandle;
use crate::infrastructure::downloader::file_downloader;
use crate::infrastructure::filesystem::paths;

pub struct ModManagerService {
    mod_repository: Arc<dyn ModRepository>,
    instance_repository: Arc<dyn InstanceRepository>,
    discord: DiscordRpcHandle,
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
}

/// Maps a content kind (shared with Modrinth's own project-type vocabulary)
/// to the subfolder Minecraft expects it in.
fn target_folder(kind: &str) -> &'static str {
    match kind {
        "resourcepack" => "resourcepacks",
        "shader" => "shaderpacks",
        _ => "mods",
    }
}

impl ModManagerService {
    pub fn new(
        mod_repository: Arc<dyn ModRepository>,
        instance_repository: Arc<dyn InstanceRepository>,
        discord: DiscordRpcHandle,
        http_client: reqwest::Client,
        app_data_dir: PathBuf,
    ) -> Self {
        Self { mod_repository, instance_repository, discord, http_client, app_data_dir }
    }

    pub fn list(&self, instance_id: &str, kind: &str) -> Result<Vec<InstalledModDTO>, InstanceError> {
        let mods = self.mod_repository.find_by_instance_and_kind(instance_id, kind)?;
        Ok(mods.into_iter().map(to_dto).collect())
    }

    pub async fn install(&self, input: InstallModInput) -> anyhow::Result<InstalledModDTO> {
        let instance_name = self
            .instance_repository
            .find_by_id(&input.instance_id)
            .map(|i| i.name)
            .unwrap_or_else(|_| input.instance_id.clone());
        let details = match input.kind.as_str() {
            "resourcepack" => "Baixando texturas",
            "shader" => "Baixando shaders",
            _ => "Baixando mods",
        };
        let _presence = self.discord.guard(details, format!("{instance_name} — {}", input.mod_name));

        let target_dir = paths::instance_dir(&self.app_data_dir, &input.instance_id).join(target_folder(&input.kind));
        let dest = target_dir.join(&input.file_name);

        file_downloader::download_to_file(&self.http_client, &input.download_url, &dest, None).await?;

        let installed = InstalledMod::new(
            input.instance_id,
            input.project_id,
            input.source.as_str().to_string(),
            input.mod_name,
            input.version_name,
            dest.display().to_string(),
            input.icon_url,
            input.kind,
        );
        self.mod_repository.save(&installed)?;
        Ok(to_dto(installed))
    }

    /// Copies a user-picked local file into the instance's mods/resourcepacks/
    /// shaderpacks folder and registers it with source `"custom"` — no
    /// update source, no re-fetch.
    pub fn install_custom(&self, input: InstallCustomModInput) -> anyhow::Result<InstalledModDTO> {
        let source_path = std::path::Path::new(&input.file_path);
        let file_name = source_path
            .file_name()
            .and_then(|n| n.to_str())
            .ok_or_else(|| anyhow::anyhow!("Nome de arquivo inválido"))?
            .to_string();
        let mod_name = source_path
            .file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or(&file_name)
            .to_string();

        let target_dir = paths::instance_dir(&self.app_data_dir, &input.instance_id).join(target_folder(&input.kind));
        std::fs::create_dir_all(&target_dir)?;
        let dest = target_dir.join(&file_name);
        std::fs::copy(source_path, &dest)?;

        let installed = InstalledMod::new(
            input.instance_id,
            file_name,
            "custom".to_string(),
            mod_name,
            "local".to_string(),
            dest.display().to_string(),
            None,
            input.kind,
        );
        self.mod_repository.save(&installed)?;
        Ok(to_dto(installed))
    }

    /// Toggling a mod renames its file with a `.disabled` suffix — the
    /// convention every Minecraft loader already ignores — instead of
    /// deleting it, so re-enabling doesn't need a re-download.
    ///
    /// The renamed path must be persisted back to `file_path`, otherwise the
    /// next toggle compares against the stale original name and never
    /// detects the file is already suffixed — silently breaking re-enable.
    pub fn set_enabled(&self, instance_id: &str, id: &str, enabled: bool) -> Result<(), InstanceError> {
        let mods = self.mod_repository.find_by_instance(instance_id)?;
        let mut installed = mods.into_iter().find(|m| m.id == id).ok_or_else(|| InstanceError::NotFound(id.to_string()))?;

        let current_path = installed.file_path.clone();
        let new_path = if enabled && current_path.ends_with(".disabled") {
            current_path.trim_end_matches(".disabled").to_string()
        } else if !enabled && !current_path.ends_with(".disabled") {
            format!("{current_path}.disabled")
        } else {
            current_path.clone()
        };

        if new_path != current_path && std::path::Path::new(&current_path).exists() {
            std::fs::rename(&current_path, &new_path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }

        installed.file_path = new_path;
        installed.enabled = enabled;
        self.mod_repository.save(&installed)
    }

    pub fn delete(&self, instance_id: &str, id: &str) -> Result<(), InstanceError> {
        let mods = self.mod_repository.find_by_instance(instance_id)?;
        if let Some(installed) = mods.into_iter().find(|m| m.id == id) {
            let _ = std::fs::remove_file(&installed.file_path);
            let _ = std::fs::remove_file(format!("{}.disabled", installed.file_path));
        }
        self.mod_repository.delete(id)
    }
}

fn to_dto(m: InstalledMod) -> InstalledModDTO {
    InstalledModDTO {
        id: m.id,
        mod_id: m.mod_id,
        source: m.source,
        name: m.name,
        version: m.version,
        icon_url: m.icon_url,
        kind: m.kind,
        enabled: m.enabled,
    }
}
