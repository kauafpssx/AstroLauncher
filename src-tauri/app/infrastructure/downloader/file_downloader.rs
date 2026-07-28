use std::path::Path;

use sha1::{Digest, Sha1};

pub async fn download_to_file(
    client: &reqwest::Client,
    url: &str,
    dest: &Path,
    expected_sha1: Option<&str>,
) -> anyhow::Result<()> {
    if dest.exists() && matches_sha1(dest, expected_sha1)? {
        return Ok(());
    }

    let bytes = client.get(url).send().await?.error_for_status()?.bytes().await?;
    if let Some(parent) = dest.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    tokio::fs::write(dest, &bytes).await?;
    Ok(())
}

fn matches_sha1(path: &Path, expected_sha1: Option<&str>) -> anyhow::Result<bool> {
    let Some(expected) = expected_sha1 else { return Ok(true) };
    let bytes = std::fs::read(path)?;
    let mut hasher = Sha1::new();
    hasher.update(&bytes);
    let digest = hex::encode(hasher.finalize());
    Ok(digest.eq_ignore_ascii_case(expected))
}
