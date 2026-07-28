use std::sync::Arc;

use crate::domain::errors::AccountError;
use crate::domain::repositories::AccountRepository;

pub struct ReorderAccountsUseCase {
    repository: Arc<dyn AccountRepository>,
}

impl ReorderAccountsUseCase {
    pub fn new(repository: Arc<dyn AccountRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, ordered_ids: Vec<String>) -> Result<(), AccountError> {
        self.repository.reorder(&ordered_ids)
    }
}
