use std::sync::Arc;

use crate::application::dto::{InstanceDTO, UpdateInstanceInput};
use crate::application::mappers::instance_mapper;
use crate::application::validation::{
    validate_optional, validate_required, MAX_INSTANCE_NAME, MAX_JAVA_ARGS, MAX_JAVA_PATH,
};
use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;

pub struct UpdateInstanceUseCase {
    repository: Arc<dyn InstanceRepository>,
}

impl UpdateInstanceUseCase {
    pub fn new(repository: Arc<dyn InstanceRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, input: UpdateInstanceInput) -> Result<InstanceDTO, InstanceError> {
        let name = validate_required(&input.name, MAX_INSTANCE_NAME)
            .map_err(InstanceError::InvalidName)?;
        let java_args = validate_optional(input.java_args, MAX_JAVA_ARGS)
            .map_err(InstanceError::InvalidValue)?;
        let java_path = validate_optional(input.java_path, MAX_JAVA_PATH)
            .map_err(InstanceError::InvalidValue)?;

        let mut instance = self.repository.find_by_id(&input.id)?;
        instance.name = name;
        instance.version = input.version;
        instance.loader = input.loader;
        instance.loader_version = input.loader_version;
        instance.java_args = java_args;
        instance.min_memory = input.min_memory;
        instance.max_memory = input.max_memory;
        instance.icon_path = input.icon_path;
        instance.fullscreen = input.fullscreen;
        instance.window_width = input.window_width;
        instance.window_height = input.window_height;
        instance.java_path = java_path;
        instance.window_monitor = input.window_monitor;

        self.repository.save(&instance)?;
        Ok(instance_mapper::to_dto(&instance))
    }
}
