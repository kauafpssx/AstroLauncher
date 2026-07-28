use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ModSource {
    Modrinth,
    Curseforge,
}

impl ModSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModSource::Modrinth => "modrinth",
            ModSource::Curseforge => "curseforge",
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModSearchResultDTO {
    pub source: ModSource,
    pub project_id: String,
    pub name: String,
    pub description: String,
    pub icon_url: Option<String>,
    pub downloads: u64,
    pub author: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModVersionDTO {
    pub id: String,
    pub name: String,
    pub file_name: String,
    pub game_versions: Vec<String>,
    pub download_url: Option<String>,
    /// Project IDs of required dependencies (same source), for auto-resolving
    /// the review/install list.
    pub required_dependency_project_ids: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchModsInput {
    pub source: ModSource,
    pub query: String,
    pub project_type: String,
    pub game_version: Option<String>,
    pub loader: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetModVersionsInput {
    pub source: ModSource,
    pub project_id: String,
    pub game_version: Option<String>,
    pub loader: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GetModProjectInput {
    pub source: ModSource,
    pub project_id: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModProjectDTO {
    pub source: ModSource,
    pub project_id: String,
    pub name: String,
    pub description: String,
    /// Full markdown body, when the source provides one (Modrinth only for
    /// now — CurseForge serves description as HTML via a separate endpoint).
    pub body: Option<String>,
    pub icon_url: Option<String>,
    pub downloads: u64,
    pub source_url: Option<String>,
    pub issues_url: Option<String>,
    pub wiki_url: Option<String>,
    pub discord_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallModInput {
    pub instance_id: String,
    pub source: ModSource,
    pub project_id: String,
    pub mod_name: String,
    pub version_name: String,
    pub file_name: String,
    pub download_url: String,
    pub icon_url: Option<String>,
    /// `"mod"`, `"resourcepack"` or `"shader"`.
    pub kind: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallCustomModInput {
    pub instance_id: String,
    pub file_path: String,
    pub kind: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallModpackInput {
    pub instance_name: String,
    pub download_url: String,
    pub folder_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledModDTO {
    pub id: String,
    pub mod_id: String,
    pub source: String,
    pub name: String,
    pub version: String,
    pub icon_url: Option<String>,
    pub kind: String,
    pub enabled: bool,
}
