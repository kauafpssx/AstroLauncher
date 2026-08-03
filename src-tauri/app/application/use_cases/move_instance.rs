use std::sync::Arc;

use crate::application::dto::InstanceDTO;
use crate::application::mappers::instance_mapper;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;

pub struct MoveInstanceToFolderUseCase {
    repository: Arc<dyn InstanceRepository>,
}

impl MoveInstanceToFolderUseCase {
    pub fn new(repository: Arc<dyn InstanceRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, id: &str, folder_id: Option<&str>) -> Result<InstanceDTO, InstanceError> {
        let mut instance = self.repository.find_by_id(id)?;

        match folder_id {
            Some(target) => {
                let position = self.repository.find_by_folder(target)?.len() as i64;
                instance.folder_id = Some(target.to_string());
                instance.position = position;
            }
            None => {
                instance.folder_id = None;
                instance.position = 0;
            }
        }

        self.repository.save(&instance)?;
        Ok(instance_mapper::to_dto(&instance))
    }
}
