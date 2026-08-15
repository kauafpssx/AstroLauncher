use crate::domain::entities::Instance;
use crate::domain::errors::InstanceError;

pub type Result<T> = std::result::Result<T, InstanceError>;

/// Local SQLite database; no async needed (see docs/12-armazenamento.md 12.10).
pub trait InstanceRepository: Send + Sync {
    fn find_all(&self) -> Result<Vec<Instance>>;
    fn find_by_id(&self, id: &str) -> Result<Instance>;
    fn find_by_folder(&self, folder_id: &str) -> Result<Vec<Instance>>;
    fn save(&self, instance: &Instance) -> Result<()>;
    fn delete(&self, id: &str) -> Result<()>;
    fn update_playtime(&self, id: &str, seconds: i64) -> Result<()>;
    fn update_last_java_major(&self, id: &str, major: Option<i64>) -> Result<()>;
    fn reorder(&self, ordered_ids: &[String]) -> Result<()>;
}
