use std::sync::Arc;

use crate::application::dto::FolderDTO;
use crate::application::mappers::folder_mapper;
use crate::domain::errors::FolderError;
use crate::domain::repositories::FolderRepository;

pub struct ListFoldersUseCase {
    repository: Arc<dyn FolderRepository>,
}

impl ListFoldersUseCase {
    pub fn new(repository: Arc<dyn FolderRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self) -> Result<Vec<FolderDTO>, FolderError> {
        let folders = self.repository.find_all()?;
        Ok(folders.iter().map(folder_mapper::to_dto).collect())
    }
}
