use std::sync::Arc;

use crate::application::dto::WaypointDTO;
use crate::application::mappers::waypoint_mapper;
use crate::domain::errors::WaypointError;
use crate::domain::repositories::WaypointRepository;

pub struct ListWaypointsUseCase {
    repository: Arc<dyn WaypointRepository>,
}

impl ListWaypointsUseCase {
    pub fn new(repository: Arc<dyn WaypointRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, instance_id: &str) -> Result<Vec<WaypointDTO>, WaypointError> {
        let waypoints = self.repository.find_by_instance(instance_id)?;
        Ok(waypoints.iter().map(waypoint_mapper::to_dto).collect())
    }
}
