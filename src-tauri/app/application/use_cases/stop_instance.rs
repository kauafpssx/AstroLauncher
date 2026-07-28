use std::sync::Arc;

use crate::infrastructure::process::manager::ProcessManager;

pub struct StopInstanceUseCase {
    process_manager: Arc<ProcessManager>,
}

impl StopInstanceUseCase {
    pub fn new(process_manager: Arc<ProcessManager>) -> Self {
        Self { process_manager }
    }

    pub fn execute(&self, instance_id: &str) -> anyhow::Result<()> {
        self.process_manager.stop(instance_id)
    }
}
