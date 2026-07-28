use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::process::manager::ProcessManager;

pub struct DeleteInstanceUseCase {
    repository: Arc<dyn InstanceRepository>,
    process_manager: Arc<ProcessManager>,
    app_data_dir: PathBuf,
}

impl DeleteInstanceUseCase {
    pub fn new(repository: Arc<dyn InstanceRepository>, process_manager: Arc<ProcessManager>, app_data_dir: PathBuf) -> Self {
        Self { repository, process_manager, app_data_dir }
    }

    pub fn execute(&self, id: &str) -> Result<(), InstanceError> {
        if self.process_manager.is_running(id) {
            return Err(InstanceError::AlreadyRunning(id.to_string()));
        }

        self.repository.delete(id)?;

        let instance_dir = paths::instance_dir(&self.app_data_dir, id);
        if instance_dir.exists() {
            // Windows briefly locks files that just had a handle closed
            // (antivirus scan, search indexer, a just-exited java.exe).
            // The instance is already gone from the DB/UI either way — a
            // few retries clear the transient case, and if it's genuinely
            // still in use we leave the folder rather than block deletion.
            if let Err(err) = remove_dir_all_with_retry(&instance_dir, 5, Duration::from_millis(200)) {
                tracing::warn!("could not fully remove instance directory {}: {err}", instance_dir.display());
            }
        }

        Ok(())
    }
}

fn remove_dir_all_with_retry(path: &Path, attempts: u32, delay: Duration) -> std::io::Result<()> {
    let mut last_err = None;
    for _ in 0..attempts {
        match std::fs::remove_dir_all(path) {
            Ok(()) => return Ok(()),
            Err(err) => {
                last_err = Some(err);
                std::thread::sleep(delay);
            }
        }
    }
    Err(last_err.unwrap())
}
