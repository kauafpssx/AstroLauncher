use serde::{Deserialize, Serialize};

mod dto;

pub use dto::*;

fn base_url() -> &'static str {
    crate::infrastructure::config::api().curseforge.as_str()
}
const MINECRAFT_GAME_ID: u32 = 432;

pub const CLASS_ID_MOD: u32 = 6;
pub const CLASS_ID_MODPACK: u32 = 4471;
pub const CLASS_ID_RESOURCE_PACK: u32 = 12;
pub const CLASS_ID_SHADER: u32 = 6552;

pub async fn get_mod(
    client: &reqwest::Client,
    api_key: &str,
    mod_id: u32,
) -> anyhow::Result<ModEntry> {
    let url = format!("{}/mods/{mod_id}", base_url());
    let response = client
        .get(&url)
        .header("x-api-key", api_key)
        .send()
        .await?
        .error_for_status()?
        .json::<ModResponse>()
        .await?;
    Ok(response.data)
}

#[derive(Debug, Serialize)]
struct ModsByIdsRequest<'a> {
    #[serde(rename = "modIds")]
    mod_ids: &'a [u32],
}

/// Resolves many mods' metadata (including their icon) in a single request:
/// used to fetch every modpack mod's icon up front instead of one call each.
pub async fn get_mods_by_ids(
    client: &reqwest::Client,
    api_key: &str,
    mod_ids: &[u32],
) -> anyhow::Result<Vec<ModEntry>> {
    if mod_ids.is_empty() {
        return Ok(Vec::new());
    }
    let url = format!("{}/mods", base_url());
    let body = ModsByIdsRequest { mod_ids };
    let response = client
        .post(url)
        .header("x-api-key", api_key)
        .json(&body)
        .send()
        .await?
        .error_for_status()?
        .json::<SearchResponse>()
        .await?;
    Ok(response.data)
}

#[derive(Debug, Deserialize)]
struct DescriptionResponse {
    data: String,
}

/// The mod's full project page, as raw HTML: CurseForge doesn't include this
/// in `get_mod`'s response, it's a dedicated endpoint.
pub async fn get_description(
    client: &reqwest::Client,
    api_key: &str,
    mod_id: u32,
) -> anyhow::Result<String> {
    let url = format!("{}/mods/{mod_id}/description", base_url());
    let response = client
        .get(&url)
        .header("x-api-key", api_key)
        .send()
        .await?
        .error_for_status()?
        .json::<DescriptionResponse>()
        .await?;
    Ok(response.data)
}

/// Resolves a single file's metadata (including its download URL): needed
/// when installing a modpack, whose manifest only lists `projectID`/`fileID`
/// pairs for each mod, not URLs.
pub async fn get_file(
    client: &reqwest::Client,
    api_key: &str,
    mod_id: u32,
    file_id: u32,
) -> anyhow::Result<File> {
    let url = format!("{}/mods/{mod_id}/files/{file_id}", base_url());
    let response = client
        .get(&url)
        .header("x-api-key", api_key)
        .send()
        .await?
        .error_for_status()?
        .json::<FileResponse>()
        .await?;
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

/// Maps our unified sort key to CurseForge Core API's `sortField` enum
/// (Popularity=2, TotalDownloads=6, ReleasedDate=11, LastUpdated=3): chosen
/// to mirror Modrinth's `relevance`/`downloads`/`newest`/`updated`.
fn sort_field(sort: Option<&str>) -> &'static str {
    match sort {
        Some("downloads") => "6",
        Some("newest") => "11",
        Some("updated") => "3",
        _ => "2",
    }
}

pub async fn search(
    client: &reqwest::Client,
    api_key: &str,
    query: &str,
    class_id: u32,
    game_version: Option<&str>,
    loader: Option<&str>,
    sort: Option<&str>,
) -> anyhow::Result<Vec<ModEntry>> {
    let mut url = reqwest::Url::parse(&format!("{}/mods/search", base_url()))?;
    {
        let mut pairs = url.query_pairs_mut();
        pairs
            .append_pair("gameId", &MINECRAFT_GAME_ID.to_string())
            .append_pair("classId", &class_id.to_string())
            .append_pair("searchFilter", query)
            .append_pair("pageSize", "30")
            .append_pair("sortField", sort_field(sort))
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
    let mut url = reqwest::Url::parse(&format!("{}/mods/{mod_id}/files", base_url()))?;
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

    let response = client
        .get(url)
        .header("x-api-key", api_key)
        .send()
        .await?
        .error_for_status()?
        .json::<FilesResponse>()
        .await?;
    Ok(response.data)
}
