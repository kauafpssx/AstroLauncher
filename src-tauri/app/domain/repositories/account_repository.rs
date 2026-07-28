use crate::domain::entities::Account;
use crate::domain::errors::AccountError;

pub type Result<T> = std::result::Result<T, AccountError>;

pub trait AccountRepository: Send + Sync {
    fn find_all(&self) -> Result<Vec<Account>>;
    fn find_by_id(&self, id: &str) -> Result<Account>;
    fn save(&self, account: &Account) -> Result<()>;
    fn delete(&self, id: &str) -> Result<()>;
    fn set_default(&self, id: &str) -> Result<()>;
    fn reorder(&self, ordered_ids: &[String]) -> Result<()>;
}
