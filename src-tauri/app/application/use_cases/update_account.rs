use std::sync::Arc;

use crate::application::dto::{AccountDTO, UpdateAccountInput};
use crate::application::mappers::account_mapper;
use crate::domain::errors::AccountError;
use crate::domain::repositories::AccountRepository;

pub struct UpdateAccountUseCase {
    repository: Arc<dyn AccountRepository>,
}

impl UpdateAccountUseCase {
    pub fn new(repository: Arc<dyn AccountRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, input: UpdateAccountInput) -> Result<AccountDTO, AccountError> {
        let username = input.username.trim().to_string();
        if username.is_empty() {
            return Err(AccountError::InvalidUsername(username));
        }

        let mut account = self.repository.find_by_id(&input.id)?;
        account.username = username;
        self.repository.save(&account)?;
        Ok(account_mapper::to_dto(&account))
    }
}
