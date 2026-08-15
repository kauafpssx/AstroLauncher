use crate::application::dto::AccountDTO;
use crate::domain::entities::Account;

pub fn to_dto(account: &Account) -> AccountDTO {
    AccountDTO {
        id: account.id.clone(),
        username: account.username.clone(),
        account_type: account.account_type.clone(),
        uuid: account.uuid.clone(),
        position: account.position,
        is_default: account.is_default,
        last_used: account.last_used.clone(),
        created_at: account.created_at.clone(),
        icon_path: account.icon_path.clone(),
    }
}

#[cfg(test)]
#[path = "tests/account_mapper_tests.rs"]
mod tests;
