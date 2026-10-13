use super::base_url;
use super::dto::{ModEntry, SearchResponse};
use super::mod_loader_type;

const MINECRAFT_GAME_ID: u32 = 432;

fn sort_field(sort: Option<&str>) -> &'static str {
    match sort {
        Some("downloads") => "6",
        Some("newest") => "11",
        Some("updated") => "3",
        _ => "2",
    }
}

pub const PAGE_SIZE: u32 = 30;

#[allow(clippy::too_many_arguments)]
pub async fn search(
    client: &reqwest::Client,
    api_key: &str,
    query: &str,
    class_id: u32,
    game_version: Option<&str>,
    loader: Option<&str>,
    sort: Option<&str>,
    offset: Option<u32>,
) -> anyhow::Result<Vec<ModEntry>> {
    let mut url = reqwest::Url::parse(&format!("{}/mods/search", base_url()))?;
    {
        let mut pairs = url.query_pairs_mut();
        pairs
            .append_pair("gameId", &MINECRAFT_GAME_ID.to_string())
            .append_pair("classId", &class_id.to_string())
            .append_pair("searchFilter", query)
            .append_pair("pageSize", &PAGE_SIZE.to_string())
            .append_pair("index", &offset.unwrap_or(0).to_string())
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
