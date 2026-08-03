use crate::domain::entities::Folder;
use crate::domain::errors::FolderError;

pub type Result<T> = std::result::Result<T, FolderError>;

/// Local SQLite database; no async needed (see docs/12-armazenamento.md 12.10).
pub trait FolderRepository: Send + Sync {
    fn find_all(&self) -> Result<Vec<Folder>>;
    fn find_by_id(&self, id: &str) -> Result<Folder>;
    fn save(&self, folder: &Folder) -> Result<()>;
    fn delete(&self, id: &str) -> Result<()>;
    fn reorder(&self, ordered_ids: &[String]) -> Result<()>;
}
