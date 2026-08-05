use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::application::dto::{
    AstroPackEventDTO, AstroPackManifest, AstroPackServerEntry, ExportResultDTO, ExportSelection,
};
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::minecraft::servers_dat;

use super::helpers::{kind_for_export_entry, read_all_notes};
use super::AstroPackService;

impl AstroPackService {
    pub async fn export_instance(
        &self,
        instance_id: &str,
        dest_path: &str,
        selection: ExportSelection,
        icon_data_uri: Option<String>,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<ExportResultDTO> {
        let instance = self.instance_repository.find_by_id(instance_id)?;
        let instance_dir = paths::instance_dir(&self.app_data_dir, instance_id);
        let mods = self.mod_repository.find_by_instance(instance_id)?;
        let enabled_mods: Vec<_> = mods
            .into_iter()
            .filter(|m| m.enabled)
            .filter(|m| match m.kind.as_str() {
                "resourcepack" => selection.resourcepacks,
                "shader" => selection.shaders,
                _ => selection.mods,
            })
            .collect();

        // Files that must be embedded in the zip: (zip entry path, local source path).
        let mut embed_files: Vec<(String, PathBuf)> = Vec::new();

        let contents = self.collect_contents(&enabled_mods, &mut embed_files).await;

        let settings = if selection.settings {
            std::fs::read_to_string(instance_dir.join("options.txt")).ok()
        } else {
            None
        };
        let notes = if selection.notes {
            read_all_notes(&instance_dir)
        } else {
            Vec::new()
        };

        let mut world_names = Vec::new();
        if selection.worlds {
            let saves_dir = instance_dir.join("saves");
            if let Ok(entries) = std::fs::read_dir(&saves_dir) {
                for entry in entries.flatten() {
                    if !entry.path().is_dir() {
                        continue;
                    }
                    let world_name = entry.file_name().to_string_lossy().to_string();
                    for file_entry in walkdir::WalkDir::new(entry.path())
                        .into_iter()
                        .filter_map(|e| e.ok())
                    {
                        if !file_entry.file_type().is_file() {
                            continue;
                        }
                        let relative = file_entry.path().strip_prefix(&saves_dir)?;
                        let zip_entry_name = format!(
                            "content/worlds/{}",
                            relative.to_string_lossy().replace('\\', "/")
                        );
                        embed_files.push((zip_entry_name, file_entry.path().to_path_buf()));
                    }
                    world_names.push(world_name);
                }
            }
        }

        let servers = if selection.servers {
            servers_dat::read_servers(&instance_dir.join("servers.dat"))
                .unwrap_or_default()
                .into_iter()
                .map(|s| AstroPackServerEntry {
                    name: s.name,
                    ip: s.ip,
                })
                .collect()
        } else {
            Vec::new()
        };

        let mut screenshot_names = Vec::new();
        if selection.screenshots {
            let shots_dir = instance_dir.join("screenshots");
            if let Ok(entries) = std::fs::read_dir(&shots_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if !path.is_file()
                        || path
                            .extension()
                            .and_then(|e| e.to_str())
                            .map(|e| e.to_lowercase())
                            != Some("png".to_string())
                    {
                        continue;
                    }
                    let name = entry.file_name().to_string_lossy().to_string();
                    embed_files.push((format!("content/screenshots/{name}"), path));
                    screenshot_names.push(name);
                }
            }
        }

        let manifest = AstroPackManifest {
            schema_version: 2,
            name: instance.name.clone(),
            version: instance.version.clone(),
            loader: instance.loader.clone(),
            loader_version: instance.loader_version.clone(),
            java_args: instance.java_args.clone(),
            min_memory: instance.min_memory,
            max_memory: instance.max_memory,
            contents,
            icon: icon_data_uri,
            settings,
            notes,
            worlds: world_names,
            servers,
            screenshots: screenshot_names,
        };

        let manifest_json = serde_json::to_string_pretty(&manifest)?;

        let dest = Path::new(dest_path);
        if let Some(parent) = dest.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let file = std::fs::File::create(dest)?;
        let mut zip = zip::ZipWriter::new(file);
        let options = zip::write::FileOptions::<()>::default();

        zip.start_file("astropack.json", options)?;
        zip.write_all(manifest_json.as_bytes())?;

        let total = embed_files.len() as u64;
        for (index, (entry_name, source_path)) in embed_files.iter().enumerate() {
            if !source_path.exists() {
                continue;
            }
            let name = source_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or(entry_name)
                .to_string();
            on_event(AstroPackEventDTO::Progress {
                kind: kind_for_export_entry(entry_name).to_string(),
                name,
                icon_url: None,
                current: index as u64,
                total,
            });

            zip.start_file(entry_name, options)?;
            let bytes = std::fs::read(source_path)?;
            zip.write_all(&bytes)?;
        }

        zip.finish()?;

        Ok(ExportResultDTO {
            file_path: dest_path.to_string(),
        })
    }
}
