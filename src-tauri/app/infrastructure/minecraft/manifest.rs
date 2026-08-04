use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct VersionManifestEntry {
    pub id: String,
    #[serde(rename = "type")]
    pub version_type: String,
    pub url: String,
    #[serde(rename = "releaseTime")]
    pub release_time: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VersionManifest {
    pub versions: Vec<VersionManifestEntry>,
}

pub async fn fetch_manifest(client: &reqwest::Client) -> anyhow::Result<VersionManifest> {
    let manifest = client
        .get(
            crate::infrastructure::config::api()
                .mojang_manifest
                .as_str(),
        )
        .send()
        .await?
        .error_for_status()?
        .json::<VersionManifest>()
        .await?;
    Ok(manifest)
}
