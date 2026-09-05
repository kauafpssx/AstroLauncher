use serde::{Deserialize, Serialize};

use super::base_url;
use super::dto::{ModEntry, ModResponse, SearchResponse};

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
