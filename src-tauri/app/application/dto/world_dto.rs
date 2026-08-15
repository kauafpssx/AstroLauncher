use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldDTO {
    pub name: String,
    pub size_bytes: u64,
    pub last_modified: Option<String>,
    pub seed: Option<i64>,
}
