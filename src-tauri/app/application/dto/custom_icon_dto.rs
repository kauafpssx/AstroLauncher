use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomIconDTO {
    pub id: String,
    pub path: String,
}
