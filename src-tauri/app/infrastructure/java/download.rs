use std::path::{Path, PathBuf};

use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct AdoptiumAsset {
    binary: AdoptiumBinary,
}

#[derive(Debug, Deserialize)]
struct AdoptiumBinary {
    package: AdoptiumPackage,
}

#[derive(Debug, Deserialize)]
struct AdoptiumPackage {
    link: String,
}

fn platform_os() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "mac"
    } else {
        "linux"
    }
}

fn platform_arch() -> &'static str {
    if cfg!(target_arch = "aarch64") {
        "aarch64"
    } else {
        "x64"
    }
}

async fn fetch_jre_download_url(client: &reqwest::Client, major: u32) -> anyhow::Result<String> {
    let url = format!(
        "{}/assets/latest/{major}/hotspot?image_type=jre&os={}&architecture={}",
        crate::infrastructure::config::api().adoptium,
        platform_os(),
        platform_arch()
    );
    let assets: Vec<AdoptiumAsset> = client
        .get(&url)
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    let asset = assets.into_iter().next().ok_or_else(|| {
        anyhow::anyhow!(
            "Nenhum Java {major} disponível para {} {}",
            platform_os(),
            platform_arch()
        )
    })?;
    Ok(asset.binary.package.link)
}

/// Downloads a portable Adoptium JRE zip and extracts it into `dest_dir`,
/// stripping the single top-level folder Adoptium zips ship with.
pub async fn download_portable_jre(
    client: &reqwest::Client,
    major: u32,
    dest_dir: &Path,
) -> anyhow::Result<()> {
    let url = fetch_jre_download_url(client, major).await?;
    let bytes = client
        .get(&url)
        .send()
        .await?
        .error_for_status()?
        .bytes()
        .await?;

    tokio::fs::create_dir_all(dest_dir).await?;
    let dest_dir = dest_dir.to_path_buf();
    let bytes = bytes.to_vec();

    tokio::task::spawn_blocking(move || extract_jre_zip(&bytes, &dest_dir)).await??;
    Ok(())
}

fn extract_jre_zip(bytes: &[u8], dest_dir: &Path) -> anyhow::Result<()> {
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let Some(enclosed) = entry.enclosed_name() else {
            continue;
        };

        // Adoptium zips wrap everything in a single "jdk-21.0.2+13-jre/" folder; drop it.
        let relative: PathBuf = enclosed.components().skip(1).collect();
        if relative.as_os_str().is_empty() {
            continue;
        }
        let out_path = dest_dir.join(relative);

        if entry.is_dir() {
            std::fs::create_dir_all(&out_path)?;
        } else {
            if let Some(parent) = out_path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let mut out_file = std::fs::File::create(&out_path)?;
            std::io::copy(&mut entry, &mut out_file)?;
        }
    }
    Ok(())
}
