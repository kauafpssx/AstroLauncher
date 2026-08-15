use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

use futures::stream::{self, StreamExt};
use serde::Deserialize;

use super::file_downloader::download_to_file;
use super::progress::ProgressReporter;

const CONCURRENCY: usize = 16;

#[derive(Debug, Clone, Deserialize)]
pub struct AssetObject {
    pub hash: String,
    pub size: u64,
}

#[derive(Debug, Deserialize)]
pub struct AssetIndex {
    pub objects: HashMap<String, AssetObject>,
}

pub async fn fetch_asset_index(
    client: &reqwest::Client,
    index_url: &str,
) -> anyhow::Result<(AssetIndex, Vec<u8>)> {
    let bytes = client
        .get(index_url)
        .send()
        .await?
        .error_for_status()?
        .bytes()
        .await?;
    let index: AssetIndex = serde_json::from_slice(&bytes)?;
    Ok((index, bytes.to_vec()))
}

pub async fn download_assets(
    client: &reqwest::Client,
    index: &AssetIndex,
    index_bytes: &[u8],
    index_id: &str,
    assets_dir: &Path,
    cancelled: &Arc<std::sync::atomic::AtomicBool>,
    reporter: &ProgressReporter,
) -> anyhow::Result<()> {
    let index_path = assets_dir.join("indexes").join(format!("{index_id}.json"));
    if let Some(parent) = index_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    tokio::fs::write(&index_path, index_bytes).await?;

    let objects_dir = assets_dir.join("objects");
    // Keep the human-readable path (e.g. `minecraft/textures/gui/...`) for
    // progress display — the hash is only what Mojang's CDN actually keys
    // objects by, not something a user should have to look at.
    let objects: Vec<(String, AssetObject)> = index.objects.clone().into_iter().collect();
    let total = objects.len() as u64;
    let completed = Arc::new(AtomicU64::new(0));

    let downloads = objects.into_iter().map(|(path, object)| {
        let client = client.clone();
        let objects_dir = objects_dir.clone();
        let reporter = reporter.clone();
        let completed = completed.clone();
        let cancelled = cancelled.clone();
        let hash = object.hash;
        let size = object.size;
        async move {
            if cancelled.load(std::sync::atomic::Ordering::SeqCst) {
                anyhow::bail!("Inicialização cancelada");
            }
            let prefix = &hash[0..2];
            let dest = objects_dir.join(prefix).join(&hash);
            let url = format!(
                "{}/{prefix}/{hash}",
                crate::infrastructure::config::api().mojang_assets,
            );
            download_to_file(&client, &url, &dest, Some(&hash)).await?;
            let done = completed.fetch_add(1, Ordering::Relaxed) + 1;
            reporter.report_item("Assets", &path, size, done, total);
            Ok::<(), anyhow::Error>(())
        }
    });

    let results: Vec<anyhow::Result<()>> = stream::iter(downloads)
        .buffer_unordered(CONCURRENCY)
        .collect()
        .await;
    for result in results {
        result?;
    }
    Ok(())
}
