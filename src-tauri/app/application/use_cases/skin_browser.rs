use crate::application::dto::{SearchSkinsInput, SkinDetailDTO, SkinPlayerDTO, SkinSummaryDTO};
use crate::infrastructure::playermc;

const PAGE_SIZE: u32 = 24;

pub struct SkinBrowserService {
    http_client: reqwest::Client,
}

impl SkinBrowserService {
    pub fn new(http_client: reqwest::Client) -> Self {
        Self { http_client }
    }

    pub async fn search(&self, input: SearchSkinsInput) -> anyhow::Result<Vec<SkinSummaryDTO>> {
        let skins = playermc::client::search(&self.http_client, &input.query, input.page, &input.sort_by, PAGE_SIZE).await?;
        Ok(skins
            .into_iter()
            .map(|s| SkinSummaryDTO {
                hash: s.hash,
                skin_url: to_https(s.skin_url),
                model: s.model,
                player_count: s.player_count,
                first_seen_player: SkinPlayerDTO { uuid: s.first_seen_player.uuid, username: s.first_seen_player.username },
            })
            .collect())
    }

    pub async fn get_skin(&self, hash: String) -> anyhow::Result<SkinDetailDTO> {
        let detail = playermc::client::get_skin(&self.http_client, &hash).await?;
        Ok(SkinDetailDTO {
            hash: detail.hash,
            skin_url: to_https(detail.skin_url),
            model: detail.model,
            player_count: detail.player_count,
            oldest_player: SkinPlayerDTO { uuid: detail.oldest_player.uuid, username: detail.oldest_player.username },
            current_players: detail
                .current_players
                .into_iter()
                .map(|p| SkinPlayerDTO { uuid: p.uuid, username: p.username })
                .collect(),
        })
    }

    pub async fn download_skin(&self, skin_url: String, dest_path: String) -> anyhow::Result<()> {
        let bytes = self.http_client.get(&skin_url).send().await?.error_for_status()?.bytes().await?;
        tokio::fs::write(&dest_path, &bytes).await?;
        Ok(())
    }
}

/// PlayerMC serves texture URLs as plain `http://`, which the webview blocks
/// as mixed content when loaded from an `https` origin; the same host serves
/// `https` just fine.
fn to_https(url: String) -> String {
    url.replacen("http://", "https://", 1)
}
