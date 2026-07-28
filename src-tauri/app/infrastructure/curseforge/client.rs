use serde::Deserialize;

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

pub async fn get_mod(client: &reqwest::Client, api_key: &str, mod_id: u32) -> anyhow::Result<ModEntry> {
    let url = format!("{BASE_URL}/mods/{mod_id}");
    let response = client.get(&url).header("x-api-key", api_key).send().await?.error_for_status()?.json::<ModResponse>().await?;
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
            .append_pair("pageSize", "30");
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
