use std::io::Read;
use std::path::Path;

use base64::Engine;

use crate::application::dto::AstroPackNoteEntry;

pub(super) async fn icon_to_data_uri(client: &reqwest::Client, url: &str) -> Option<String> {
    let response = client.get(url).send().await.ok()?;
    let mime = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/png")
        .to_string();
    let bytes = response.bytes().await.ok()?;
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Some(format!("data:{mime};base64,{encoded}"))
}

pub(super) fn target_folder(kind: &str) -> &'static str {
    match kind {
        "resourcepack" => "resourcepacks",
        "shader" => "shaderpacks",
        _ => "mods",
    }
}

/// Reverses `target_folder` (plus the `worlds`/`screenshots` entries added
/// separately) from a zip entry's path, for progress events during export.
pub(super) fn kind_for_export_entry(entry_name: &str) -> &'static str {
    if entry_name.starts_with("content/resourcepacks/") {
        "resourcepack"
    } else if entry_name.starts_with("content/shaderpacks/") {
        "shader"
    } else if entry_name.starts_with("content/worlds/") {
        "world"
    } else if entry_name.starts_with("content/screenshots/") {
        "screenshot"
    } else {
        "mod"
    }
}

pub(super) fn read_manifest_json<R: std::io::Read + std::io::Seek>(
    archive: &mut zip::ZipArchive<R>,
) -> anyhow::Result<String> {
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        if entry.name() == "astropack.json" {
            let mut s = String::new();
            entry.read_to_string(&mut s)?;
            return Ok(s);
        }
    }
    anyhow::bail!("astropack.json não encontrado no arquivo")
}

pub(super) fn count_files(dir: &Path, ext: &str) -> usize {
    std::fs::read_dir(dir)
        .map(|entries| {
            entries
                .flatten()
                .filter(|e| {
                    e.path()
                        .extension()
                        .and_then(|x| x.to_str())
                        .map(|x| x.eq_ignore_ascii_case(ext))
                        .unwrap_or(false)
                })
                .count()
        })
        .unwrap_or(0)
}

/// Reads every note as an export entry. Falls back to the legacy single
/// `notes.txt` when the instance hasn't been opened (and thus migrated to
/// `notes/`) since multi-note support landed.
pub(super) fn read_all_notes(instance_dir: &Path) -> Vec<AstroPackNoteEntry> {
    let notes_dir = instance_dir.join("notes");
    if notes_dir.exists() {
        let mut entries = Vec::new();
        if let Ok(dir_entries) = std::fs::read_dir(&notes_dir) {
            for entry in dir_entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) != Some("md") {
                    continue;
                }
                let Some(title) = path.file_stem().and_then(|s| s.to_str()) else {
                    continue;
                };
                if let Ok(content) = std::fs::read_to_string(&path) {
                    entries.push(AstroPackNoteEntry {
                        title: title.to_string(),
                        content,
                    });
                }
            }
        }
        entries.sort_by_key(|a| a.title.to_lowercase());
        entries
    } else if let Ok(content) = std::fs::read_to_string(instance_dir.join("notes.txt")) {
        if content.trim().is_empty() {
            Vec::new()
        } else {
            vec![AstroPackNoteEntry {
                title: "Nota 1".to_string(),
                content,
            }]
        }
    } else {
        Vec::new()
    }
}

pub(super) fn count_dirs(dir: &Path) -> usize {
    std::fs::read_dir(dir)
        .map(|entries| entries.flatten().filter(|e| e.path().is_dir()).count())
        .unwrap_or(0)
}
