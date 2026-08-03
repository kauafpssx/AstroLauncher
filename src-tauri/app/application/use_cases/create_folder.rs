use std::sync::Arc;

use crate::application::dto::{CreateFolderInput, FolderDTO};
use crate::application::mappers::folder_mapper;
use crate::domain::entities::Folder;
use crate::domain::errors::FolderError;
use crate::domain::repositories::FolderRepository;

pub struct CreateFolderUseCase {
    repository: Arc<dyn FolderRepository>,
}

impl CreateFolderUseCase {
    pub fn new(repository: Arc<dyn FolderRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, input: CreateFolderInput) -> Result<FolderDTO, FolderError> {
        let name = input.name.trim().to_string();
        if name.is_empty() {
            return Err(FolderError::InvalidName(name));
        }

        let position = self.repository.find_all()?.len() as i64;
        let folder = Folder::new(name, position);

        self.repository.save(&folder)?;
        Ok(folder_mapper::to_dto(&folder))
    }
}
