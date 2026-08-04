use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SkinSource {
    Playermc,
    Mcstat,
}

impl SkinSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            SkinSource::Playermc => "playermc",
            SkinSource::Mcstat => "mcstat",
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchSkinsInput {
    pub source: SkinSource,
    pub query: String,
    pub page: u32,
    pub sort_by: String,
    /// MCStat only — Classic/Slim skin model filter.
    #[serde(default)]
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkinPlayerDTO {
    pub uuid: String,
    pub username: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkinSummaryDTO {
    /// Source-scoped identifier — PlayerMC's texture hash or mcstat.org's slug.
    pub id: String,
    pub source: SkinSource,
    pub skin_url: String,
    pub model: String,
    pub player_count: u64,
    pub first_seen_player: SkinPlayerDTO,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkinDetailDTO {
    pub id: String,
    pub source: SkinSource,
    pub skin_url: String,
    pub model: String,
    pub player_count: u64,
    pub oldest_player: SkinPlayerDTO,
    pub current_players: Vec<SkinPlayerDTO>,
}
