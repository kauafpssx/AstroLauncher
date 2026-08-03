use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchSkinsInput {
    pub query: String,
    pub page: u32,
    pub sort_by: String,
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
    pub hash: String,
    pub skin_url: String,
    pub model: String,
    pub player_count: u64,
    pub first_seen_player: SkinPlayerDTO,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkinDetailDTO {
    pub hash: String,
    pub skin_url: String,
    pub model: String,
    pub player_count: u64,
    pub oldest_player: SkinPlayerDTO,
    pub current_players: Vec<SkinPlayerDTO>,
}
