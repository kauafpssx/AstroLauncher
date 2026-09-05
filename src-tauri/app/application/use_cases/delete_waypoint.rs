use std::sync::Arc;

use crate::domain::errors::WaypointError;
use crate::domain::repositories::WaypointRepository;

pub struct DeleteWaypointUseCase {
    repository: Arc<dyn WaypointRepository>,
}

impl DeleteWaypointUseCase {
    pub fn new(repository: Arc<dyn WaypointRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, id: &str) -> Result<(), WaypointError> {
        self.repository.delete(id)
    }
}
