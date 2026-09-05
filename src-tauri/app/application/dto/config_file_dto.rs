use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigFileDTO {
    pub path: String,
    pub size_bytes: u64,
}
