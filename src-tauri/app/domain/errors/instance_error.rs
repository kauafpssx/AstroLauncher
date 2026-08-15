#[derive(Debug, thiserror::Error)]
pub enum InstanceError {
    #[error("Instance '{0}' not found")]
    NotFound(String),
    #[error("Instance '{0}' already exists")]
    AlreadyExists(String),
    #[error("Invalid instance name: {0}")]
    InvalidName(String),
    #[error("Invalid value: {0}")]
    InvalidValue(String),
    #[error("Instance '{0}' is currently running")]
    AlreadyRunning(String),
    #[error("Persistence error: {0}")]
    Persistence(String),
}
