use std::sync::Arc;

use crate::application::dto::InstanceDTO;
use crate::application::mappers::instance_mapper;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;

pub struct ListInstancesUseCase {
    repository: Arc<dyn InstanceRepository>,
}

impl ListInstancesUseCase {
    pub fn new(repository: Arc<dyn InstanceRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self) -> Result<Vec<InstanceDTO>, InstanceError> {
        let instances = self.repository.find_all()?;
        Ok(instances.iter().map(instance_mapper::to_dto).collect())
    }
}
