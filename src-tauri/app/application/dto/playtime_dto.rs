use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaytimeSummaryDTO {
    /// Total playtime for the instance, in seconds (denormalized on `instances`).
    pub total_seconds: i64,
    /// When the instance was last played (ISO-8601), if ever.
    pub last_played: Option<String>,
    /// Duration of the most recent completed session, in seconds.
    pub last_session_seconds: Option<i64>,
}
