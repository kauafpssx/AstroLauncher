use std::sync::Arc;

use crate::application::dto::{AccountDTO, CreateAccountInput};
use crate::application::mappers::account_mapper;
use crate::domain::entities::Account;
use crate::domain::errors::AccountError;
use crate::domain::repositories::AccountRepository;

pub struct CreateAccountUseCase {
    repository: Arc<dyn AccountRepository>,
}

impl CreateAccountUseCase {
    pub fn new(repository: Arc<dyn AccountRepository>) -> Self {
        Self { repository }
    }

    pub fn execute(&self, input: CreateAccountInput) -> Result<AccountDTO, AccountError> {
        let username = input.username.trim().to_string();
        if username.is_empty() {
            return Err(AccountError::InvalidUsername(username));
        }

        let position = self.repository.find_all()?.len() as i64;
        let mut account = Account::new_offline(username, position);
        if position == 0 {
            account.is_default = true;
        }

        self.repository.save(&account)?;
        Ok(account_mapper::to_dto(&account))
    }
}
