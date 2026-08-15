use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JavaInfoDTO {
    pub major_version: Option<u32>,
    pub install_size_bytes: Option<u64>,
}
