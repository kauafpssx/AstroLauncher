use crate::application::dto::VersionDTO;
use crate::infrastructure::minecraft::manifest;

pub struct FetchVersionManifestUseCase {
    http_client: reqwest::Client,
}

impl FetchVersionManifestUseCase {
    pub fn new(http_client: reqwest::Client) -> Self {
        Self { http_client }
    }

    pub async fn execute(&self) -> anyhow::Result<Vec<VersionDTO>> {
        let manifest = manifest::fetch_manifest(&self.http_client).await?;
        Ok(manifest
            .versions
            .into_iter()
            .map(|v| VersionDTO {
                id: v.id,
                version_type: v.version_type,
                release_time: v.release_time,
            })
            .collect())
    }
}
