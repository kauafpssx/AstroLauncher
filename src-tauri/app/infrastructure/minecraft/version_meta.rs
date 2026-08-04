use std::collections::HashMap;

use serde::Deserialize;

use super::rules::Rule;

#[derive(Debug, Clone, Deserialize)]
pub struct DownloadArtifact {
    pub url: String,
    pub sha1: String,
    pub size: u64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VersionDownloads {
    pub client: DownloadArtifact,
}

#[derive(Debug, Clone, Deserialize)]
pub struct AssetIndexRef {
    pub id: String,
    pub url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LibraryDownloads {
    pub artifact: Option<DownloadArtifact>,
    pub classifiers: Option<HashMap<String, DownloadArtifact>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Library {
    pub name: String,
    pub downloads: Option<LibraryDownloads>,
    pub rules: Option<Vec<Rule>>,
    pub natives: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JavaVersionRequirement {
    #[serde(rename = "majorVersion")]
    pub major_version: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct VersionMeta {
    pub id: String,
    #[serde(rename = "mainClass")]
    pub main_class: String,
    pub downloads: VersionDownloads,
    pub libraries: Vec<Library>,
    #[serde(rename = "assetIndex")]
    pub asset_index: AssetIndexRef,
    #[serde(rename = "javaVersion")]
    pub java_version: Option<JavaVersionRequirement>,
}

pub async fn fetch_version_meta(
    client: &reqwest::Client,
    url: &str,
) -> anyhow::Result<VersionMeta> {
    let meta = client
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json::<VersionMeta>()
        .await?;
    Ok(meta)
}
