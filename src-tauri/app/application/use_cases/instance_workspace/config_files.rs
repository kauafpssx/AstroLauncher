use std::path::PathBuf;

use crate::application::dto::ConfigFileDTO;
use crate::domain::errors::InstanceError;
use crate::infrastructure::filesystem::safe_path::safe_join;

use super::InstanceWorkspaceService;

impl InstanceWorkspaceService {
    /// Resolves a `/`-separated relative path against the instance directory,
    /// rejecting anything that would escape it (`..`, absolute/drive paths).
    fn config_file_path(&self, id: &str, relative_path: &str) -> Result<PathBuf, InstanceError> {
        let dir = self.instance_dir(id)?;
        safe_join(&dir, relative_path)
            .ok_or_else(|| InstanceError::InvalidName(relative_path.to_string()))
    }

    /// `options.txt`/`optionsof.txt` (Minecraft's own settings) plus every
    /// file under `config/` (where mods keep theirs) — the practical surface
    /// a "config editor" needs, without special-casing individual mods.
    pub fn list_config_files(&self, id: &str) -> Result<Vec<ConfigFileDTO>, InstanceError> {
        let instance_dir = self.instance_dir(id)?;
        let mut files = Vec::new();

        for name in ["options.txt", "optionsof.txt"] {
            let path = instance_dir.join(name);
            if let Ok(metadata) = std::fs::metadata(&path) {
                files.push(ConfigFileDTO {
                    path: name.to_string(),
                    size_bytes: metadata.len(),
                });
            }
        }

        let config_dir = instance_dir.join("config");
        if config_dir.exists() {
            for entry in walkdir::WalkDir::new(&config_dir)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if !entry.file_type().is_file() {
                    continue;
                }
                let Ok(relative) = entry.path().strip_prefix(&instance_dir) else {
                    continue;
                };
                let Some(size_bytes) = entry.metadata().ok().map(|m| m.len()) else {
                    continue;
                };
                files.push(ConfigFileDTO {
                    path: relative.to_string_lossy().replace('\\', "/"),
                    size_bytes,
                });
            }
        }

        Ok(files)
    }

    pub fn read_config_file(&self, id: &str, relative_path: &str) -> Result<String, InstanceError> {
        let path = self.config_file_path(id, relative_path)?;
        std::fs::read_to_string(&path).map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn write_config_file(
        &self,
        id: &str,
        relative_path: &str,
        content: &str,
    ) -> Result<(), InstanceError> {
        let path = self.config_file_path(id, relative_path)?;
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        std::fs::write(path, content).map_err(|e| InstanceError::Persistence(e.to_string()))
    }
}
