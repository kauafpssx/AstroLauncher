use std::path::{Path, PathBuf};
use std::sync::Arc;

use chrono::{DateTime, Utc};

use crate::application::dto::{ScreenshotDTO, ServerEntryDTO, WorldDTO};
use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::minecraft::servers_dat::{self, ServerEntry};

/// Filesystem-backed operations scoped to a single instance's workspace
/// (log file, notes, saved worlds). Grouped together since none of these
/// carry real domain logic beyond "does this instance exist".
pub struct InstanceWorkspaceService {
    instance_repository: Arc<dyn InstanceRepository>,
    app_data_dir: PathBuf,
}

impl InstanceWorkspaceService {
    pub fn new(instance_repository: Arc<dyn InstanceRepository>, app_data_dir: PathBuf) -> Self {
        Self { instance_repository, app_data_dir }
    }

    fn instance_dir(&self, id: &str) -> Result<PathBuf, InstanceError> {
        self.instance_repository.find_by_id(id)?;
        Ok(paths::instance_dir(&self.app_data_dir, id))
    }

    pub fn read_log(&self, id: &str) -> Result<String, InstanceError> {
        let log_path = self.instance_dir(id)?.join("logs").join("latest.log");
        Ok(std::fs::read_to_string(&log_path).unwrap_or_default())
    }

    pub fn read_notes(&self, id: &str) -> Result<String, InstanceError> {
        let notes_path = self.instance_dir(id)?.join("notes.txt");
        Ok(std::fs::read_to_string(&notes_path).unwrap_or_default())
    }

    pub fn write_notes(&self, id: &str, content: &str) -> Result<(), InstanceError> {
        let dir = self.instance_dir(id)?;
        std::fs::create_dir_all(&dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        std::fs::write(dir.join("notes.txt"), content).map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn open_folder(&self, id: &str) -> Result<(), InstanceError> {
        let dir = self.instance_dir(id)?;
        std::fs::create_dir_all(&dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        std::process::Command::new("explorer")
            .arg(&dir)
            .spawn()
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }

    pub fn list_worlds(&self, id: &str) -> Result<Vec<WorldDTO>, InstanceError> {
        let saves_dir = self.instance_dir(id)?.join("saves");
        if !saves_dir.exists() {
            return Ok(Vec::new());
        }

        let mut worlds = Vec::new();
        let entries = std::fs::read_dir(&saves_dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            let size_bytes = dir_size(&path);
            let last_modified = std::fs::metadata(&path)
                .and_then(|m| m.modified())
                .ok()
                .map(|t| DateTime::<Utc>::from(t).to_rfc3339());

            worlds.push(WorldDTO { name, size_bytes, last_modified });
        }
        Ok(worlds)
    }

    pub fn delete_world(&self, id: &str, world_name: &str) -> Result<(), InstanceError> {
        if world_name.is_empty() || world_name.contains("..") || world_name.contains('/') || world_name.contains('\\') {
            return Err(InstanceError::InvalidName(world_name.to_string()));
        }

        let world_dir = self.instance_dir(id)?.join("saves").join(world_name);
        if world_dir.exists() {
            std::fs::remove_dir_all(&world_dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        Ok(())
    }

    fn servers_dat_path(&self, id: &str) -> Result<PathBuf, InstanceError> {
        Ok(self.instance_dir(id)?.join("servers.dat"))
    }

    pub fn list_servers(&self, id: &str) -> Result<Vec<ServerEntryDTO>, InstanceError> {
        let path = self.servers_dat_path(id)?;
        let servers = servers_dat::read_servers(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(servers
            .into_iter()
            .enumerate()
            .map(|(index, s)| ServerEntryDTO { index, name: s.name, ip: s.ip })
            .collect())
    }

    pub fn add_server(&self, id: &str, name: &str, ip: &str) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        servers.push(ServerEntry { name: name.to_string(), ip: ip.to_string() });
        servers_dat::write_servers(&path, &servers).map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn update_server(&self, id: &str, index: usize, name: &str, ip: &str) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let entry = servers.get_mut(index).ok_or_else(|| InstanceError::InvalidName(index.to_string()))?;
        entry.name = name.to_string();
        entry.ip = ip.to_string();
        servers_dat::write_servers(&path, &servers).map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn delete_server(&self, id: &str, index: usize) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        if index >= servers.len() {
            return Err(InstanceError::InvalidName(index.to_string()));
        }
        servers.remove(index);
        servers_dat::write_servers(&path, &servers).map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    fn screenshot_path(&self, id: &str, name: &str) -> Result<PathBuf, InstanceError> {
        if name.is_empty() || name.contains("..") || name.contains('/') || name.contains('\\') {
            return Err(InstanceError::InvalidName(name.to_string()));
        }
        Ok(self.instance_dir(id)?.join("screenshots").join(name))
    }

    pub fn list_screenshots(&self, id: &str) -> Result<Vec<ScreenshotDTO>, InstanceError> {
        let dir = self.instance_dir(id)?.join("screenshots");
        if !dir.exists() {
            return Ok(Vec::new());
        }

        let mut shots = Vec::new();
        let entries = std::fs::read_dir(&dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_file() || path.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()) != Some("png".to_string()) {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            let metadata = std::fs::metadata(&path).ok();
            let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
            let taken_at = metadata
                .and_then(|m| m.modified().ok())
                .map(|t| DateTime::<Utc>::from(t).to_rfc3339());
            shots.push(ScreenshotDTO { name, size_bytes, taken_at });
        }
        shots.sort_by(|a, b| b.taken_at.cmp(&a.taken_at));
        Ok(shots)
    }

    pub fn read_screenshot_data_uri(&self, id: &str, name: &str) -> Result<String, InstanceError> {
        use base64::Engine;
        let path = self.screenshot_path(id, name)?;
        let bytes = std::fs::read(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
        Ok(format!("data:image/png;base64,{encoded}"))
    }

    pub fn delete_screenshot(&self, id: &str, name: &str) -> Result<(), InstanceError> {
        let path = self.screenshot_path(id, name)?;
        if path.exists() {
            std::fs::remove_file(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        Ok(())
    }

    /// Renames only the base name, keeping the original file extension intact.
    pub fn rename_screenshot(&self, id: &str, name: &str, new_base_name: &str) -> Result<String, InstanceError> {
        if new_base_name.is_empty() || new_base_name.contains("..") || new_base_name.contains('/') || new_base_name.contains('\\') {
            return Err(InstanceError::InvalidName(new_base_name.to_string()));
        }

        let source = self.screenshot_path(id, name)?;
        let ext = Path::new(name).extension().and_then(|e| e.to_str()).unwrap_or("png");
        let new_name = format!("{new_base_name}.{ext}");
        if new_name == name {
            return Ok(new_name);
        }

        let dest = self.screenshot_path(id, &new_name)?;
        if dest.exists() {
            return Err(InstanceError::Persistence("Já existe uma screenshot com esse nome".to_string()));
        }

        std::fs::rename(&source, &dest).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(new_name)
    }

    pub fn save_screenshot_as(&self, id: &str, name: &str, dest_path: &str) -> Result<(), InstanceError> {
        let source = self.screenshot_path(id, name)?;
        std::fs::copy(&source, dest_path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }
}

fn dir_size(path: &Path) -> u64 {
    walkdir::WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}
