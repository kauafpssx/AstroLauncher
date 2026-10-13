use std::path::PathBuf;
use std::sync::Arc;

use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;
use crate::infrastructure::filesystem::explorer;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::filesystem::size::dir_size;

mod config_files;
mod notes;
mod screenshots;
mod servers;
mod shortcuts;
mod worlds;

#[derive(Clone)]
pub struct InstanceWorkspaceService {
    instance_repository: Arc<dyn InstanceRepository>,
    app_data_dir: PathBuf,
}

impl InstanceWorkspaceService {
    pub fn new(instance_repository: Arc<dyn InstanceRepository>, app_data_dir: PathBuf) -> Self {
        Self {
            instance_repository,
            app_data_dir,
        }
    }

    fn instance_dir(&self, id: &str) -> Result<PathBuf, InstanceError> {
        self.instance_repository.find_by_id(id)?;
        Ok(paths::instance_dir(&self.app_data_dir, id))
    }

    pub fn read_log(&self, id: &str) -> Result<String, InstanceError> {
        let log_path = self.instance_dir(id)?.join("logs").join("latest.log");
        Ok(std::fs::read_to_string(&log_path).unwrap_or_default())
    }

    pub fn open_folder(&self, id: &str) -> Result<(), InstanceError> {
        let dir = self.instance_dir(id)?;
        std::fs::create_dir_all(&dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;

        if explorer::focus_existing_window(&dir) {
            return Ok(());
        }

        #[cfg_attr(not(target_os = "windows"), allow(unused_mut))]
        let mut cmd = std::process::Command::new(file_manager_bin());
        cmd.arg(&dir);
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            cmd.creation_flags(CREATE_NO_WINDOW);
        }
        cmd.spawn()
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }

    pub fn disk_usage_bytes(&self, id: &str) -> Result<u64, InstanceError> {
        let dir = self.instance_dir(id)?;
        if !dir.exists() {
            return Ok(0);
        }
        Ok(dir_size(&dir))
    }
}

fn file_manager_bin() -> &'static str {
    if cfg!(target_os = "windows") {
        "explorer"
    } else if cfg!(target_os = "macos") {
        "open"
    } else {
        "xdg-open"
    }
}
