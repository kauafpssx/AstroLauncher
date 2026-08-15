use std::sync::Arc;

use crate::application::dto::{FolderDTO, UpdateFolderInput};
use crate::application::mappers::folder_mapper;
use crate::application::validation::{validate_required, MAX_FOLDER_NAME};
use crate::domain::errors::FolderError;
use crate::domain::repositories::FolderRepository;

pub struct UpdateFolderUseCase {
    repository: Arc<dyn FolderRepository>,
}

impl UpdateFolderUseCase {
    pub fn new(repository: Arc<dyn FolderRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, input: UpdateFolderInput) -> Result<FolderDTO, FolderError> {
        let name =
            validate_required(&input.name, MAX_FOLDER_NAME).map_err(FolderError::InvalidName)?;

        let mut folder = self.repository.find_by_id(&input.id)?;
        folder.name = name;
        folder.collapsed = input.collapsed;

        match input.icon_path {
            Some(path) if path.trim().is_empty() => folder.icon_path = None,
            Some(path) => folder.icon_path = Some(path),
            None => {}
        }

        self.repository.save(&folder)?;
        Ok(folder_mapper::to_dto(&folder))
    }
}
