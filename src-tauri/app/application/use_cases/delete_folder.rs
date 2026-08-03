use std::sync::Arc;

use crate::domain::errors::FolderError;
use crate::domain::repositories::FolderRepository;

pub struct DeleteFolderUseCase {
    repository: Arc<dyn FolderRepository>,
}

impl DeleteFolderUseCase {
    pub fn new(repository: Arc<dyn FolderRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, id: &str) -> Result<(), FolderError> {
        self.repository.delete(id)
    }
}
