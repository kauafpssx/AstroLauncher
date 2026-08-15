use std::sync::Arc;

use crate::application::dto::{AccountDTO, UpdateAccountInput};
use crate::application::mappers::account_mapper;
use crate::application::validation::{validate_required, MAX_ACCOUNT_USERNAME};
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
        let username = validate_required(&input.username, MAX_ACCOUNT_USERNAME)
            .map_err(AccountError::InvalidUsername)?;

        let mut account = self.repository.find_by_id(&input.id)?;
        account.username = username;
        account.icon_path = input.icon_path;
        self.repository.save(&account)?;
        Ok(account_mapper::to_dto(&account))
    }
}
