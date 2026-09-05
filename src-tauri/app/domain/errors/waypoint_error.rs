#[derive(Debug, thiserror::Error)]
pub enum WaypointError {
    #[error("Waypoint '{0}' not found")]
    NotFound(String),
    #[error("Persistence error: {0}")]
    Persistence(String),
}
