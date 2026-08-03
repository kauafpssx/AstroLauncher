use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderDTO {
    pub id: String,
    pub name: String,
    pub position: i64,
    pub collapsed: bool,
    pub icon_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFolderInput {
    pub name: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFolderInput {
    pub id: String,
    pub name: String,
    pub collapsed: bool,
    #[serde(default)]
    pub icon_path: Option<String>,
}
