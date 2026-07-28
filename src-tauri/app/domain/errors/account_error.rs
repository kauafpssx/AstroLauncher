#[derive(Debug, thiserror::Error)]
pub enum AccountError {
    #[error("Account '{0}' not found")]
    NotFound(String),
    #[error("Invalid username: {0}")]
    InvalidUsername(String),
    #[error("Persistence error: {0}")]
    Persistence(String),
}
