use std::sync::Arc;

use crate::application::dto::{FolderDTO, UpdateFolderInput};
use crate::application::mappers::folder_mapper;
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
        let name = input.name.trim().to_string();
        if name.is_empty() {
            return Err(FolderError::InvalidName(name));
        }

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
