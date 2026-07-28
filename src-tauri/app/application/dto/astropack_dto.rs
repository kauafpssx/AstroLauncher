use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AstroPackManifest {
    pub schema_version: u64,
    pub name: String,
    pub version: String,
    pub loader: Option<String>,
    pub loader_version: Option<String>,
    pub java_args: Option<String>,
    pub min_memory: i64,
    pub max_memory: i64,
    pub contents: Vec<AstroPackContentEntry>,
    #[serde(default)]
    pub settings: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub worlds: Vec<String>,
    #[serde(default)]
    pub servers: Vec<AstroPackServerEntry>,
    #[serde(default)]
    pub screenshots: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AstroPackContentEntry {
    pub kind: String,
    pub source: String,
    pub project_id: String,
    pub name: String,
    pub version_name: String,
    pub file_name: String,
    pub download_url: Option<String>,
    pub icon_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AstroPackServerEntry {
    pub name: String,
    pub ip: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSelection {
    pub settings: bool,
    pub worlds: bool,
    pub notes: bool,
    pub mods: bool,
    pub resourcepacks: bool,
    pub shaders: bool,
    pub servers: bool,
    pub screenshots: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSummaryDTO {
    pub mods: usize,
    pub resourcepacks: usize,
    pub shaders: usize,
    pub worlds: usize,
    pub has_notes: bool,
    pub has_settings: bool,
    pub servers: usize,
    pub screenshots: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum AstroPackEventDTO {
    #[serde(rename_all = "camelCase")]
    Progress {
        kind: String,
        name: String,
        current: u64,
        total: u64,
    },
    #[serde(rename_all = "camelCase")]
    Done {
        instance_id: String,
    },
    Error {
        message: String,
    },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportAstroPackInput {
    pub file_path: String,
    pub selection: ExportSelection,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResultDTO {
    pub file_path: String,
}
