use std::sync::Arc;

use crate::domain::errors::AccountError;
use crate::domain::repositories::AccountRepository;

pub struct SetDefaultAccountUseCase {
    repository: Arc<dyn AccountRepository>,
}

impl SetDefaultAccountUseCase {
    pub fn new(repository: Arc<dyn AccountRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, id: &str) -> Result<(), AccountError> {
        self.repository.set_default(id)
    }
}
