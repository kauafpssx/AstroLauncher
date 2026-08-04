use crate::domain::entities::PlaytimeSession;
use crate::domain::errors::InstanceError;

pub type Result<T> = std::result::Result<T, InstanceError>;

/// Individual playtime sessions (see docs/12-armazenamento.md). Sessions are
/// inserted when a game spawns and closed with a duration when it exits; the
/// instance row keeps a denormalized total for fast listing.
pub trait PlaytimeRepository: Send + Sync {
    fn insert(&self, session: &PlaytimeSession) -> Result<()>;
    fn find_by_id(&self, id: &str) -> Result<Option<PlaytimeSession>>;
    fn find_latest_by_instance(&self, instance_id: &str) -> Result<Option<PlaytimeSession>>;
    fn find_open_by_instance(&self, instance_id: &str) -> Result<Option<PlaytimeSession>>;
    fn update_end(&self, id: &str, ended_at: &str, duration_seconds: i64) -> Result<()>;

    /// Closes every session still left open (`ended_at IS NULL`) with zero
    /// credited duration. A session only ever gets its normal `update_end`
    /// call from the process-exit watcher (see `ProcessManager`); if the app
    /// itself crashes or gets force-killed while a game is running, that
    /// watcher never fires and the row is orphaned. Left alone, the next
    /// `get_summary` call would treat it as still live and add however long
    /// it's been since the crash to the displayed playtime. Call once at
    /// startup, before anything else can read playtime — `ProcessManager` is
    /// always empty right after boot, so any open row at that point is
    /// necessarily stale.
    fn close_orphaned_sessions(&self) -> Result<()>;
}
