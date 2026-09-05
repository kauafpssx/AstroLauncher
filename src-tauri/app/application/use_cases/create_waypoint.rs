use std::sync::Arc;

use crate::application::dto::{CreateWaypointInput, WaypointDTO};
use crate::application::mappers::waypoint_mapper;
use crate::domain::entities::Waypoint;
use crate::domain::errors::WaypointError;
use crate::domain::repositories::WaypointRepository;

pub struct CreateWaypointUseCase {
    repository: Arc<dyn WaypointRepository>,
}

impl CreateWaypointUseCase {
    pub fn new(repository: Arc<dyn WaypointRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, input: CreateWaypointInput) -> Result<WaypointDTO, WaypointError> {
        let waypoint = Waypoint::new(
            input.instance_id,
            input.name,
            input.icon,
            input.dimension,
            input.x,
            input.y,
            input.z,
        );

        self.repository.save(&waypoint)?;
        Ok(waypoint_mapper::to_dto(&waypoint))
    }
}
