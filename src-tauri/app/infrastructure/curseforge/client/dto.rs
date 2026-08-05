use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SearchResponse {
    pub data: Vec<ModEntry>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ModEntry {
    pub id: u32,
    pub name: String,
    pub summary: String,
    pub logo: Option<Logo>,
    pub authors: Vec<Author>,
    #[serde(rename = "downloadCount")]
    pub download_count: u64,
    #[serde(rename = "latestFilesIndexes", default)]
    pub latest_files_indexes: Vec<FileIndex>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct FileIndex {
    #[serde(rename = "modLoader")]
    pub mod_loader: Option<u32>,
    #[serde(rename = "gameVersion")]
    pub game_version: String,
}

impl ModEntry {
    /// The primary loader this modpack targets, if any of its listed file
    /// indexes carries a recognized `modLoader` value (CurseForge's enum:
    /// 1=Forge, 4=Fabric, 5=Quilt, 6=NeoForge).
    pub fn primary_loader(&self) -> Option<&'static str> {
        self.latest_files_indexes
            .iter()
            .find_map(|f| match f.mod_loader {
                Some(1) => Some("forge"),
                Some(4) => Some("fabric"),
                Some(5) => Some("quilt"),
                Some(6) => Some("neoforge"),
                _ => None,
            })
    }

    /// The newest Minecraft version this modpack has a build for.
    pub fn latest_game_version(&self) -> Option<&str> {
        self.latest_files_indexes
            .first()
            .map(|f| f.game_version.as_str())
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct Logo {
    pub url: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Author {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct FilesResponse {
    pub data: Vec<File>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct File {
    pub id: u32,
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "downloadUrl")]
    pub download_url: Option<String>,
    #[serde(rename = "gameVersions")]
    pub game_versions: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct ModResponse {
    pub data: ModEntry,
}

#[derive(Debug, Deserialize)]
pub struct FileResponse {
    pub data: File,
}
