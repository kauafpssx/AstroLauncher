#[derive(Debug, thiserror::Error)]
pub enum WorldgenError {
    #[error("Unsupported Minecraft version '{0}'")]
    UnsupportedVersion(String),
    #[error("Invalid dimension '{0}'")]
    InvalidDimension(String),
    #[error("Invalid worldgen input: {0}")]
    InvalidInput(String),
    #[error("Worldgen error: {0}")]
    Ffi(String),
}
