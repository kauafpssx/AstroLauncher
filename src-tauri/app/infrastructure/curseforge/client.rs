use serde::{Deserialize, Serialize};

const BASE_URL: &str = "https://api.curseforge.com/v1";
const MINECRAFT_GAME_ID: u32 = 432;

pub const CLASS_ID_MOD: u32 = 6;
pub const CLASS_ID_MODPACK: u32 = 4471;
pub const CLASS_ID_RESOURCE_PACK: u32 = 12;
pub const CLASS_ID_SHADER: u32 = 6552;

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
        self.latest_files_indexes.iter().find_map(|f| match f.mod_loader {
            Some(1) => Some("forge"),
            Some(4) => Some("fabric"),
            Some(5) => Some("quilt"),
            Some(6) => Some("neoforge"),
            _ => None,
        })
    }

    /// The newest Minecraft version this modpack has a build for.
    pub fn latest_game_version(&self) -> Option<&str> {
        self.latest_files_indexes.first().map(|f| f.game_version.as_str())
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

pub async fn get_mod(client: &reqwest::Client, api_key: &str, mod_id: u32) -> anyhow::Result<ModEntry> {
    let url = format!("{BASE_URL}/mods/{mod_id}");
    let response = client.get(&url).header("x-api-key", api_key).send().await?.error_for_status()?.json::<ModResponse>().await?;
    Ok(response.data)
}

#[derive(Debug, Serialize)]
struct ModsByIdsRequest<'a> {
    #[serde(rename = "modIds")]
    mod_ids: &'a [u32],
}

/// Resolves many mods' metadata (including their icon) in a single request —
/// used to fetch every modpack mod's icon up front instead of one call each.
pub async fn get_mods_by_ids(client: &reqwest::Client, api_key: &str, mod_ids: &[u32]) -> anyhow::Result<Vec<ModEntry>> {
    if mod_ids.is_empty() {
        return Ok(Vec::new());
    }
    let url = format!("{BASE_URL}/mods");
    let body = ModsByIdsRequest { mod_ids };
    let response =
        client.post(url).header("x-api-key", api_key).json(&body).send().await?.error_for_status()?.json::<SearchResponse>().await?;
    Ok(response.data)
}

#[derive(Debug, Deserialize)]
struct DescriptionResponse {
    data: String,
}

/// The mod's full project page, as raw HTML — CurseForge doesn't include this
/// in `get_mod`'s response, it's a dedicated endpoint.
pub async fn get_description(client: &reqwest::Client, api_key: &str, mod_id: u32) -> anyhow::Result<String> {
    let url = format!("{BASE_URL}/mods/{mod_id}/description");
    let response = client.get(&url).header("x-api-key", api_key).send().await?.error_for_status()?.json::<DescriptionResponse>().await?;
    Ok(response.data)
}

/// Resolves a single file's metadata (including its download URL) — needed
/// when installing a modpack, whose manifest only lists `projectID`/`fileID`
/// pairs for each mod, not URLs.
pub async fn get_file(client: &reqwest::Client, api_key: &str, mod_id: u32, file_id: u32) -> anyhow::Result<File> {
    let url = format!("{BASE_URL}/mods/{mod_id}/files/{file_id}");
    let response = client.get(&url).header("x-api-key", api_key).send().await?.error_for_status()?.json::<FileResponse>().await?;
    Ok(response.data)
}

/// CurseForge's `ModLoaderType` enum (see their API docs' Schemas section).
fn mod_loader_type(loader: &str) -> Option<u32> {
    match loader {
        "forge" => Some(1),
        "fabric" => Some(4),
        "quilt" => Some(5),
        "neoforge" => Some(6),
        _ => None,
    }
}

pub async fn search(
    client: &reqwest::Client,
    api_key: &str,
    query: &str,
    class_id: u32,
    game_version: Option<&str>,
    loader: Option<&str>,
) -> anyhow::Result<Vec<ModEntry>> {
    let mut url = reqwest::Url::parse(&format!("{BASE_URL}/mods/search"))?;
    {
        let mut pairs = url.query_pairs_mut();
        pairs
            .append_pair("gameId", &MINECRAFT_GAME_ID.to_string())
            .append_pair("classId", &class_id.to_string())
            .append_pair("searchFilter", query)
            .append_pair("pageSize", "30")
            .append_pair("sortField", "6") // TotalDownloads
            .append_pair("sortOrder", "desc");
        if let Some(gv) = game_version {
            pairs.append_pair("gameVersion", gv);
        }
        if let Some(loader_id) = loader.and_then(mod_loader_type) {
            pairs.append_pair("modLoaderType", &loader_id.to_string());
        }
    }

    let response = client
        .get(url)
        .header("x-api-key", api_key)
        .send()
        .await?
        .error_for_status()?
        .json::<SearchResponse>()
        .await?;
    Ok(response.data)
}

pub async fn get_files(
    client: &reqwest::Client,
    api_key: &str,
    mod_id: u32,
    game_version: Option<&str>,
    loader: Option<&str>,
) -> anyhow::Result<Vec<File>> {
    let mut url = reqwest::Url::parse(&format!("{BASE_URL}/mods/{mod_id}/files"))?;
    {
        let mut pairs = url.query_pairs_mut();
        pairs.append_pair("pageSize", "30");
        if let Some(gv) = game_version {
            pairs.append_pair("gameVersion", gv);
        }
        if let Some(loader_id) = loader.and_then(mod_loader_type) {
            pairs.append_pair("modLoaderType", &loader_id.to_string());
        }
    }

    let response = client.get(url).header("x-api-key", api_key).send().await?.error_for_status()?.json::<FilesResponse>().await?;
    Ok(response.data)
}
