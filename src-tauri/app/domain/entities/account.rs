#[derive(Debug, Clone, PartialEq)]
pub struct Account {
    pub id: String,
    pub username: String,
    pub account_type: String,
    pub uuid: String,
    pub position: i64,
    pub is_default: bool,
    pub last_used: Option<String>,
    pub created_at: String,
    /// Path to a saved custom avatar (e.g. a cropped skin head), reusing the
    /// same storage as instance/folder custom icons. `None` falls back to
    /// the username-initials avatar in the UI.
    pub icon_path: Option<String>,
}

impl Account {
    pub fn new_offline(username: String, position: i64) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            username,
            account_type: "offline".to_string(),
            uuid: uuid::Uuid::new_v4().to_string(),
            position,
            is_default: false,
            last_used: None,
            created_at: chrono::Utc::now().to_rfc3339(),
            icon_path: None,
        }
    }
}

#[cfg(test)]
#[path = "tests/account_tests.rs"]
mod tests;
