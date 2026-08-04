use std::collections::HashMap;
use std::path::Path;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ModrinthIndex {
    pub name: String,
    pub dependencies: HashMap<String, String>,
    pub files: Vec<PackFile>,
}

#[derive(Debug, Deserialize)]
pub struct PackFile {
    pub path: String,
    pub hashes: PackFileHashes,
    pub env: Option<PackFileEnv>,
    pub downloads: Vec<String>,
    #[serde(rename = "fileSize")]
    pub file_size: u64,
}

#[derive(Debug, Deserialize)]
pub struct PackFileHashes {
    pub sha1: String,
}

#[derive(Debug, Deserialize)]
pub struct PackFileEnv {
    pub client: String,
}

impl PackFile {
    /// Files can be marked "unsupported" on the client (server-only plugins).
    pub fn is_client_supported(&self) -> bool {
        self.env
            .as_ref()
            .map(|e| e.client != "unsupported")
            .unwrap_or(true)
    }
}

pub struct ExtractedPack {
    pub index: ModrinthIndex,
    pub archive_bytes: Vec<u8>,
}

pub fn read_index(bytes: &[u8]) -> anyhow::Result<ModrinthIndex> {
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;
    let mut index_file = archive.by_name("modrinth.index.json")?;
    let mut contents = String::new();
    std::io::Read::read_to_string(&mut index_file, &mut contents)?;
    Ok(serde_json::from_str(&contents)?)
}

/// Extracts the `overrides/` (and `client-overrides/`) folders from the
/// `.mrpack` archive directly into the instance directory.
pub fn extract_overrides(bytes: &[u8], instance_dir: &Path) -> anyhow::Result<()> {
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let Some(enclosed) = entry.enclosed_name() else {
            continue;
        };
        let name = enclosed.to_string_lossy();

        let relative = if let Some(rest) = name.strip_prefix("overrides/") {
            rest
        } else if let Some(rest) = name.strip_prefix("client-overrides/") {
            rest
        } else {
            continue;
        };
        if relative.is_empty() {
            continue;
        }

        let out_path = instance_dir.join(relative);
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
