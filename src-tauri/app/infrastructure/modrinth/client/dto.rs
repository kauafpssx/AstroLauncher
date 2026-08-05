use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SearchResponse {
    pub hits: Vec<SearchHit>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SearchHit {
    pub project_id: String,
    pub title: String,
    pub description: String,
    pub icon_url: Option<String>,
    pub downloads: u64,
    pub author: String,
    #[serde(default)]
    pub categories: Vec<String>,
    #[serde(default)]
    pub versions: Vec<String>,
}

const LOADER_CATEGORIES: [&str; 4] = ["fabric", "forge", "quilt", "neoforge"];

impl SearchHit {
    /// Modrinth tags a modpack's loader as a regular category (alongside
    /// things like "adventure" or "technology") rather than a separate field.
    pub fn primary_loader(&self) -> Option<&str> {
        self.categories
            .iter()
            .find(|c| LOADER_CATEGORIES.contains(&c.as_str()))
            .map(|c| c.as_str())
    }

    /// The newest Minecraft version this project supports — `versions` is
    /// sorted oldest to newest, so the last entry is the most recent.
    pub fn latest_game_version(&self) -> Option<&str> {
        self.versions.last().map(String::as_str)
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct Version {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub version_number: String,
    pub game_versions: Vec<String>,
    pub loaders: Vec<String>,
    pub files: Vec<VersionFile>,
    #[serde(default)]
    pub dependencies: Vec<Dependency>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct VersionFile {
    pub url: String,
    pub filename: String,
    pub primary: bool,
    pub size: u64,
    pub hashes: FileHashes,
}

#[derive(Debug, Deserialize, Clone)]
pub struct FileHashes {
    pub sha1: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Dependency {
    pub project_id: Option<String>,
    pub dependency_type: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Project {
    pub title: String,
    pub description: String,
    pub body: String,
    pub icon_url: Option<String>,
    pub downloads: u64,
    pub source_url: Option<String>,
    pub issues_url: Option<String>,
    pub wiki_url: Option<String>,
    pub discord_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ProjectSummary {
    pub id: String,
    pub title: String,
    pub icon_url: Option<String>,
}
