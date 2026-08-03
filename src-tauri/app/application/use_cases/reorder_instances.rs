use std::sync::Arc;

use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;

pub struct ReorderInstancesUseCase {
    repository: Arc<dyn InstanceRepository>,
}

impl ReorderInstancesUseCase {
    pub fn new(repository: Arc<dyn InstanceRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, ordered_ids: Vec<String>) -> Result<(), InstanceError> {
        self.repository.reorder(&ordered_ids)
    }
}
