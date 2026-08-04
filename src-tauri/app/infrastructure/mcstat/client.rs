use serde::Deserialize;

fn base_url() -> &'static str {
    crate::infrastructure::config::api().mcstat.as_str()
}

#[derive(Debug, Deserialize, Clone)]
pub struct SkinOwner {
    #[allow(dead_code)]
    pub id: String,
    pub username: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Skin {
    pub slug: String,
    pub name: String,
    pub model: String,
    #[serde(rename = "pngPath")]
    pub png_path: String,
    #[serde(rename = "playersUsingCount", default)]
    pub players_using_count: u64,
    pub owner: Option<SkinOwner>,
}

#[derive(Debug, Deserialize)]
struct SkinsData {
    skins: Vec<Skin>,
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
    success: bool,
    data: Option<SkinsData>,
    error: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SkinPlayerUsing {
    pub id: String,
    #[serde(rename = "mainNickname")]
    pub main_nickname: String,
    #[serde(rename = "minecraftUuid")]
    pub minecraft_uuid: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SkinDetail {
    pub slug: String,
    pub name: String,
    pub model: String,
    #[serde(rename = "pngPath")]
    pub png_path: String,
    #[serde(rename = "playersUsingCount", default)]
    pub players_using_count: u64,
    #[serde(rename = "playersUsing", default)]
    pub players_using: Vec<SkinPlayerUsing>,
}

#[derive(Debug, Deserialize)]
struct SkinDetailData {
    skin: SkinDetail,
}

#[derive(Debug, Deserialize)]
struct SkinDetailResponse {
    success: bool,
    data: Option<SkinDetailData>,
    error: Option<String>,
}

/// Searches mcstat.org's community skin uploads. `sort` mirrors their own
/// values: `recent`, `popular`, `trending`. `model` filters by skin model
/// (`classic`/`slim`) when given.
pub async fn search(
    client: &reqwest::Client,
    api_key: &str,
    query: &str,
    page: u32,
    sort: &str,
    model: Option<&str>,
    limit: u32,
) -> anyhow::Result<Vec<Skin>> {
    let mut url = reqwest::Url::parse(&format!("{}/skins", base_url()))?;
    {
        let mut pairs = url.query_pairs_mut();
        pairs
            .append_pair("page", &page.to_string())
            .append_pair("sort", sort)
            .append_pair("limit", &limit.to_string());
        if !query.trim().is_empty() {
            pairs.append_pair("search", query.trim());
        }
        if let Some(model) = model {
            pairs.append_pair("model", model);
        }
    }

    let response = client
        .get(url)
        .header("X-API-Key", api_key)
        .send()
        .await?
        .error_for_status()?
        .json::<SearchResponse>()
        .await?;
    if !response.success {
        anyhow::bail!(response
            .error
            .unwrap_or_else(|| "Falha ao buscar skins".to_string()));
    }
    Ok(response.data.map(|d| d.skins).unwrap_or_default())
}

/// Fetches a skin's detail by slug, including every player profile currently
/// wearing it.
pub async fn get_skin(
    client: &reqwest::Client,
    api_key: &str,
    slug: &str,
) -> anyhow::Result<SkinDetail> {
    let response = client
        .get(format!("{}/skins/{slug}", base_url()))
        .header("X-API-Key", api_key)
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
        .map(|d| d.skin)
        .ok_or_else(|| anyhow::anyhow!("Skin não encontrada"))
}
