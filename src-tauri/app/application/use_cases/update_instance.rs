use std::sync::Arc;

use crate::application::dto::{InstanceDTO, UpdateInstanceInput};
use crate::application::mappers::instance_mapper;
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
        let name = input.name.trim().to_string();
        if name.is_empty() {
            return Err(InstanceError::InvalidName(name));
        }

        let mut instance = self.repository.find_by_id(&input.id)?;
        instance.name = name;
        instance.version = input.version;
        instance.loader = input.loader;
        instance.loader_version = input.loader_version;
        instance.java_args = input.java_args;
        instance.min_memory = input.min_memory;
        instance.max_memory = input.max_memory;
        instance.icon_path = input.icon_path;

        self.repository.save(&instance)?;
        Ok(instance_mapper::to_dto(&instance))
    }
}
