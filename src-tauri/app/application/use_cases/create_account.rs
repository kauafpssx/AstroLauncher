use std::sync::Arc;

use crate::application::dto::{AccountDTO, CreateAccountInput};
use crate::application::mappers::account_mapper;
use crate::application::validation::{validate_required, MAX_ACCOUNT_USERNAME};
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
        let username = validate_required(&input.username, MAX_ACCOUNT_USERNAME)
            .map_err(AccountError::InvalidUsername)?;

        let position = self.repository.find_all()?.len() as i64;
        let mut account = Account::new_offline(username, position);
        if position == 0 {
            account.is_default = true;
        }
        account.icon_path = input.icon_path;

        self.repository.save(&account)?;
        Ok(account_mapper::to_dto(&account))
    }
}
