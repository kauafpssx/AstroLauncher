use std::sync::Arc;

use crate::application::dto::{CreateInstanceInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::application::validation::{validate_required, MAX_INSTANCE_NAME};
use crate::domain::entities::Instance;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;

pub struct CreateInstanceUseCase {
    repository: Arc<dyn InstanceRepository>,
}

impl CreateInstanceUseCase {
    pub fn new(repository: Arc<dyn InstanceRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, input: CreateInstanceInput) -> Result<InstanceDTO, InstanceError> {
        let name = validate_required(&input.name, MAX_INSTANCE_NAME)
            .map_err(InstanceError::InvalidName)?;

        let mut instance = Instance::new(name, input.version);
        instance.loader = input.loader;
        instance.loader_version = input.loader_version;
        instance.folder_id = input.folder_id;
        instance.icon_path = input.icon_path;

        self.repository.save(&instance)?;
        Ok(instance_mapper::to_dto(&instance))
    }
}
