use std::sync::Arc;

use crate::application::dto::AccountDTO;
use crate::application::mappers::account_mapper;
use crate::domain::errors::AccountError;
use crate::domain::repositories::AccountRepository;

pub struct ListAccountsUseCase {
    repository: Arc<dyn AccountRepository>,
}

impl ListAccountsUseCase {
    pub fn new(repository: Arc<dyn AccountRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self) -> Result<Vec<AccountDTO>, AccountError> {
        let accounts = self.repository.find_all()?;
        Ok(accounts.iter().map(account_mapper::to_dto).collect())
    }
}
