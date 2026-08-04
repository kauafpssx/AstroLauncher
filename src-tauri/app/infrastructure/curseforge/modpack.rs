use std::path::Path;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Manifest {
    pub minecraft: ManifestMinecraft,
    pub files: Vec<ManifestFile>,
    pub overrides: String,
}

#[derive(Debug, Deserialize)]
pub struct ManifestMinecraft {
    pub version: String,
    #[serde(rename = "modLoaders")]
    pub mod_loaders: Vec<ManifestModLoader>,
}

#[derive(Debug, Deserialize)]
pub struct ManifestModLoader {
    pub id: String,
    pub primary: bool,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ManifestFile {
    #[serde(rename = "projectID")]
    pub project_id: u32,
    #[serde(rename = "fileID")]
    pub file_id: u32,
}

pub fn read_manifest(bytes: &[u8]) -> anyhow::Result<Manifest> {
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;
    let mut file = archive.by_name("manifest.json")?;
    let mut contents = String::new();
    std::io::Read::read_to_string(&mut file, &mut contents)?;
    Ok(serde_json::from_str(&contents)?)
}

/// Extracts the pack's `overrides` folder (its name is declared in the
/// manifest, conventionally `overrides`) directly into the instance directory.
pub fn extract_overrides(
    bytes: &[u8],
    overrides_folder: &str,
    instance_dir: &Path,
) -> anyhow::Result<()> {
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor)?;
    let prefix = format!("{overrides_folder}/");

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let Some(enclosed) = entry.enclosed_name() else {
            continue;
        };
        let name = enclosed.to_string_lossy();
        let Some(relative) = name.strip_prefix(prefix.as_str()) else {
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

/// CurseForge modpack manifests encode the loader as `"<loader>-<version>"`
/// (e.g. `"forge-47.2.0"`, `"neoforge-20.4.80"`) in the primary `modLoaders` entry.
pub fn parse_loader_id(id: &str) -> Option<(String, String)> {
    let (loader, version) = id.split_once('-')?;
    match loader {
        "forge" | "fabric" | "neoforge" | "quilt" => {
            Some((loader.to_string(), version.to_string()))
        }
        _ => None,
    }
}
