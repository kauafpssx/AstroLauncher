use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaytimeSummaryDTO {
    pub total_seconds: i64,
    pub last_played: Option<String>,
    pub last_session_seconds: Option<i64>,
}
