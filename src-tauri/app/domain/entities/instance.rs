#[derive(Debug, Clone, PartialEq)]
pub struct Instance {
    pub id: String,
    pub name: String,
    pub version: String,
    pub loader: Option<String>,
    pub loader_version: Option<String>,
    pub icon_path: Option<String>,
    pub java_args: Option<String>,
    pub min_memory: i64,
    pub max_memory: i64,
    pub folder_id: Option<String>,
    pub position: i64,
    pub created_at: String,
    pub last_played: Option<String>,
    pub playtime_seconds: i64,
    pub fullscreen: bool,
    pub window_width: Option<i64>,
    pub window_height: Option<i64>,
    pub java_path: Option<String>,
    pub window_monitor: Option<String>,
    /// Major version of the Java actually used the last time this instance
    /// launched (system or portable, whichever `ensure_java` picked) — set
    /// right before spawn, `None` until the first successful launch. Powers
    /// the Settings tab's "automatic" Java display without having to
    /// re-fetch the version manifest just to show info.
    pub last_java_major: Option<i64>,
}

impl Instance {
    pub fn new(name: String, version: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            version,
            loader: None,
            loader_version: None,
            icon_path: None,
            java_args: None,
            min_memory: 2048,
            max_memory: 4096,
            folder_id: None,
            position: 0,
            created_at: chrono::Utc::now().to_rfc3339(),
            last_played: None,
            playtime_seconds: 0,
            fullscreen: false,
            window_width: None,
            window_height: None,
            java_path: None,
            window_monitor: None,
            last_java_major: None,
        }
    }
}

#[cfg(test)]
#[path = "tests/instance_tests.rs"]
mod tests;
