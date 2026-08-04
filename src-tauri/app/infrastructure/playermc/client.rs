use serde::Deserialize;

fn base_url() -> &'static str {
    crate::infrastructure::config::api().playermc.as_str()
}

#[derive(Debug, Deserialize, Clone)]
pub struct SkinPlayer {
    pub uuid: String,
    pub username: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SkinSummary {
    #[serde(rename = "playerCount")]
    pub player_count: u64,
    #[serde(rename = "firstSeenPlayer")]
    pub first_seen_player: SkinPlayer,
    #[serde(rename = "skinUrl")]
    pub skin_url: String,
    pub hash: String,
    pub model: String,
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
    data: Vec<SkinSummary>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SkinDetail {
    pub hash: String,
    #[serde(rename = "skinUrl")]
    pub skin_url: String,
    #[serde(rename = "playerCount")]
    pub player_count: u64,
    pub model: String,
    #[serde(rename = "oldestPlayer")]
    pub oldest_player: SkinPlayer,
    #[serde(rename = "currentPlayers")]
    pub current_players: Vec<SkinPlayer>,
}

#[derive(Debug, Deserialize)]
struct SkinDetailResponse {
    success: bool,
    data: Option<SkinDetail>,
    error: Option<String>,
}

/// Searches PlayerMC's index of Minecraft skins observed on servers running
/// their tracking plugin. `sort_by` mirrors their own site's values, e.g.
/// `"popular-desc"` / `"popular-asc"`.
pub async fn search(
    client: &reqwest::Client,
    query: &str,
    page: u32,
    sort_by: &str,
    limit: u32,
) -> anyhow::Result<Vec<SkinSummary>> {
    let mut url = reqwest::Url::parse(&format!("{}/skins", base_url()))?;
    {
        let mut pairs = url.query_pairs_mut();
        pairs
            .append_pair("page", &page.to_string())
            .append_pair("sortBy", sort_by)
            .append_pair("limit", &limit.to_string());
        if !query.trim().is_empty() {
            pairs.append_pair("search", query.trim());
        }
    }

    let response = client
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json::<SearchResponse>()
        .await?;
    Ok(response.data)
}

/// Fetches a skin's detail, including every player profile currently wearing
/// it — used to let the user copy a specific in-game name for a skin they like.
pub async fn get_skin(client: &reqwest::Client, hash: &str) -> anyhow::Result<SkinDetail> {
    let response = client
        .get(format!("{}/skins/{hash}", base_url()))
        .send()
        .await?
        .error_for_status()?
        .json::<SkinDetailResponse>()
        .await?;
    if !response.success {
        anyhow::bail!(response
            .error
            .unwrap_or_else(|| "Skin não encontrada".to_string()));
    }
    response
        .data
        .ok_or_else(|| anyhow::anyhow!("Skin não encontrada"))
}
