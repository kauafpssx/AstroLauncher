#[derive(Debug, Clone, PartialEq)]
pub struct PlaytimeSession {
    pub id: String,
    pub instance_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_seconds: i64,
}

impl PlaytimeSession {
    pub fn new(instance_id: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            instance_id,
            started_at: chrono::Utc::now().to_rfc3339(),
            ended_at: None,
            duration_seconds: 0,
        }
    }
}
