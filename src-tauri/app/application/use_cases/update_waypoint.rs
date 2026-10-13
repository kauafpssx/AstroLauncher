use std::sync::Arc;

use crate::application::dto::{UpdateWaypointInput, WaypointDTO};
use crate::application::mappers::waypoint_mapper;
use crate::domain::errors::WaypointError;
use crate::domain::repositories::WaypointRepository;

pub struct UpdateWaypointUseCase {
    repository: Arc<dyn WaypointRepository>,
}

impl UpdateWaypointUseCase {
    pub fn new(repository: Arc<dyn WaypointRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(
        &self,
        id: &str,
        input: UpdateWaypointInput,
    ) -> Result<WaypointDTO, WaypointError> {
        let mut waypoint = self.repository.find_by_id(id)?;
        waypoint.name = input.name;
        waypoint.icon = input.icon;
        waypoint.dimension = input.dimension;
        waypoint.x = input.x;
        waypoint.y = input.y;
        waypoint.z = input.z;

        self.repository.update(&waypoint)?;
        Ok(waypoint_mapper::to_dto(&waypoint))
    }
}
