use chrono::{DateTime, Utc};

use crate::application::dto::WorldDTO;
use crate::domain::errors::InstanceError;
use crate::infrastructure::filesystem::size::dir_size;

use super::InstanceWorkspaceService;
use crate::infrastructure::minecraft::world_seed::world_seed;

impl InstanceWorkspaceService {
    pub fn list_worlds(&self, id: &str) -> Result<Vec<WorldDTO>, InstanceError> {
        let saves_dir = self.instance_dir(id)?.join("saves");
        if !saves_dir.exists() {
            return Ok(Vec::new());
        }

        let mut worlds = Vec::new();
        let entries =
            std::fs::read_dir(&saves_dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
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

            worlds.push(WorldDTO {
                name,
                size_bytes,
                last_modified,
                seed: world_seed(&path),
            });
        }
        Ok(worlds)
    }

    pub fn delete_world(&self, id: &str, world_name: &str) -> Result<(), InstanceError> {
        if world_name.is_empty()
            || world_name.contains("..")
            || world_name.contains('/')
            || world_name.contains('\\')
        {
            return Err(InstanceError::InvalidName(world_name.to_string()));
        }

        let world_dir = self.instance_dir(id)?.join("saves").join(world_name);
        if world_dir.exists() {
            std::fs::remove_dir_all(&world_dir)
                .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        Ok(())
    }
}
