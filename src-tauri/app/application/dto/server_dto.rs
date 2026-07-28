use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServerEntryDTO {
    pub index: usize,
    pub name: String,
    pub ip: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveServerInput {
    pub name: String,
    pub ip: String,
}
