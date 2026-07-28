use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenshotDTO {
    pub name: String,
    pub size_bytes: u64,
    pub taken_at: Option<String>,
}
