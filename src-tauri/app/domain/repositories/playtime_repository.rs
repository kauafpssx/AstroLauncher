use crate::domain::entities::PlaytimeSession;
use crate::domain::errors::InstanceError;

pub type Result<T> = std::result::Result<T, InstanceError>;

pub trait PlaytimeRepository: Send + Sync {
    fn insert(&self, session: &PlaytimeSession) -> Result<()>;
    fn find_by_id(&self, id: &str) -> Result<Option<PlaytimeSession>>;
    fn find_latest_by_instance(&self, instance_id: &str) -> Result<Option<PlaytimeSession>>;
    fn find_open_by_instance(&self, instance_id: &str) -> Result<Option<PlaytimeSession>>;
    fn update_end(&self, id: &str, ended_at: &str, duration_seconds: i64) -> Result<()>;

    fn close_orphaned_sessions(&self) -> Result<()>;
}
