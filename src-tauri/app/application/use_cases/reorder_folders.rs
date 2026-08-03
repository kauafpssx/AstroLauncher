use std::sync::Arc;

use crate::domain::errors::FolderError;
use crate::domain::repositories::FolderRepository;

pub struct ReorderFoldersUseCase {
    repository: Arc<dyn FolderRepository>,
}

impl ReorderFoldersUseCase {
    pub fn new(repository: Arc<dyn FolderRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, ordered_ids: Vec<String>) -> Result<(), FolderError> {
        self.repository.reorder(&ordered_ids)
    }
}
