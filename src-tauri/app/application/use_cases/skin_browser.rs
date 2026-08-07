use std::path::PathBuf;

use base64::Engine;

use crate::application::dto::{
    SearchSkinsInput, SkinDetailDTO, SkinPlayerDTO, SkinSource, SkinSummaryDTO,
};
use crate::infrastructure::persistence::config::json_settings_repository;
use crate::infrastructure::{mcstat, playermc};

const PAGE_SIZE: u32 = 24;

pub struct SkinBrowserService {
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
}

impl SkinBrowserService {
    pub fn new(http_client: reqwest::Client, app_data_dir: PathBuf) -> Self {
        Self {
            http_client,
            app_data_dir,
        }
    }

    fn mcstat_api_key(&self) -> anyhow::Result<String> {
        json_settings_repository::resolve_mcstat_api_key(&self.app_data_dir).ok_or_else(|| {
            anyhow::anyhow!("Configure sua API key do MCStat em Configurações antes de buscar.")
        })
    }

    pub async fn search(&self, input: SearchSkinsInput) -> anyhow::Result<Vec<SkinSummaryDTO>> {
        match input.source {
            SkinSource::Playermc => {
                let skins = playermc::client::search(
                    &self.http_client,
                    &input.query,
                    input.page,
                    &input.sort_by,
                    PAGE_SIZE,
                )
                .await?;
                Ok(skins
                    .into_iter()
                    .map(|s| SkinSummaryDTO {
                        id: s.hash,
                        source: SkinSource::Playermc,
                        skin_url: to_https(s.skin_url),
                        model: s.model,
                        player_count: s.player_count,
                        first_seen_player: SkinPlayerDTO {
                            uuid: s.first_seen_player.uuid,
                            username: s.first_seen_player.username,
                        },
                    })
                    .collect())
            }
            SkinSource::Mcstat => {
                let api_key = self.mcstat_api_key()?;
                let skins = mcstat::client::search(
                    &self.http_client,
                    &api_key,
                    &input.query,
                    input.page,
                    &input.sort_by,
                    input.model.as_deref(),
                    PAGE_SIZE,
                )
                .await?;
                Ok(skins
                    .into_iter()
                    .map(|s| SkinSummaryDTO {
                        id: s.slug,
                        source: SkinSource::Mcstat,
                        skin_url: s.png_path,
                        model: s.model,
                        player_count: s.players_using_count,
                        // The skin's own name is what identifies it in this
                        // gallery: `owner` is usually mcstat's own bulk-import
                        // bot account (`MojangSkins`), not a meaningful label.
                        first_seen_player: SkinPlayerDTO {
                            uuid: String::new(),
                            username: s.name,
                        },
                    })
                    .collect())
            }
        }
    }

    pub async fn get_skin(&self, source: SkinSource, id: String) -> anyhow::Result<SkinDetailDTO> {
        match source {
            SkinSource::Playermc => {
                let detail = playermc::client::get_skin(&self.http_client, &id).await?;
                Ok(SkinDetailDTO {
                    id: detail.hash,
                    source: SkinSource::Playermc,
                    skin_url: to_https(detail.skin_url),
                    model: detail.model,
                    player_count: detail.player_count,
                    oldest_player: SkinPlayerDTO {
                        uuid: detail.oldest_player.uuid,
                        username: detail.oldest_player.username,
                    },
                    current_players: detail
                        .current_players
                        .into_iter()
                        .map(|p| SkinPlayerDTO {
                            uuid: p.uuid,
                            username: p.username,
                        })
                        .collect(),
                })
            }
            SkinSource::Mcstat => {
                let api_key = self.mcstat_api_key()?;
                let detail = mcstat::client::get_skin(&self.http_client, &api_key, &id).await?;
                let current_players: Vec<SkinPlayerDTO> = detail
                    .players_using
                    .into_iter()
                    .map(|p| SkinPlayerDTO {
                        uuid: p.minecraft_uuid.unwrap_or(p.id),
                        username: p.main_nickname,
                    })
                    .collect();
                let oldest_player = current_players.first().cloned().unwrap_or(SkinPlayerDTO {
                    uuid: String::new(),
                    username: detail.name.clone(),
                });
                Ok(SkinDetailDTO {
                    id: detail.slug,
                    source: SkinSource::Mcstat,
                    skin_url: detail.png_path,
                    model: detail.model,
                    player_count: detail.players_using_count,
                    oldest_player,
                    current_players,
                })
            }
        }
    }

    pub async fn download_skin(&self, skin_url: String, dest_path: String) -> anyhow::Result<()> {
        let bytes = self
            .http_client
            .get(&skin_url)
            .send()
            .await?
            .error_for_status()?
            .bytes()
            .await?;
        tokio::fs::write(&dest_path, &bytes).await?;
        Ok(())
    }

    /// Fetches a texture PNG server-side and returns it standard base64
    /// encoded: mcstat.org doesn't send CORS headers, so the webview can't
    /// `fetch()` it directly, and feeding it through here also guarantees a
    /// same-origin `data:` URI for the local skinview3d thumbnail renderer
    /// (a cross-origin image without a CORS-clean response taints the
    /// canvas, breaking `toDataURL`).
    pub async fn fetch_texture_base64(&self, url: String) -> anyhow::Result<String> {
        let bytes = self
            .http_client
            .get(&url)
            .send()
            .await?
            .error_for_status()?
            .bytes()
            .await?;
        Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
    }
}

/// PlayerMC serves texture URLs as plain `http://`, which the webview blocks
/// as mixed content when loaded from an `https` origin; the same host serves
/// `https` just fine.
fn to_https(url: String) -> String {
    url.replacen("http://", "https://", 1)
}
