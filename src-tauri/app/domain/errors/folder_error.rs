#[derive(Debug, thiserror::Error)]
pub enum FolderError {
    #[error("Folder '{0}' not found")]
    NotFound(String),
    #[error("Invalid folder name: {0}")]
    InvalidName(String),
    #[error("Persistence error: {0}")]
    Persistence(String),
}
