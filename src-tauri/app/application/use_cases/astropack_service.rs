use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::Context;
use base64::Engine;

use crate::application::dto::{
    AstroPackContentEntry, AstroPackEventDTO, AstroPackManifest, AstroPackNoteEntry,
    AstroPackServerEntry, ExportResultDTO, ExportSelection, ExportSummaryDTO, InstanceDTO,
};
use crate::application::mappers::instance_mapper;
use crate::domain::entities::{InstalledMod, Instance};
use crate::domain::repositories::{InstanceRepository, ModRepository};
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::minecraft::servers_dat::{self, ServerEntry};
use crate::infrastructure::persistence::config::json_settings_repository;
use crate::infrastructure::{curseforge, modrinth};

pub struct AstroPackService {
    instance_repository: Arc<dyn InstanceRepository>,
    mod_repository: Arc<dyn ModRepository>,
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
}

async fn icon_to_data_uri(client: &reqwest::Client, url: &str) -> Option<String> {
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

fn target_folder(kind: &str) -> &'static str {
    match kind {
        "resourcepack" => "resourcepacks",
        "shader" => "shaderpacks",
        _ => "mods",
    }
}

/// Reverses `target_folder` (plus the `worlds`/`screenshots` entries added
/// separately) from a zip entry's path, for progress events during export.
fn kind_for_export_entry(entry_name: &str) -> &'static str {
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

fn read_manifest_json<R: std::io::Read + std::io::Seek>(
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

fn count_files(dir: &Path, ext: &str) -> usize {
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
fn read_all_notes(instance_dir: &Path) -> Vec<AstroPackNoteEntry> {
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

fn count_dirs(dir: &Path) -> usize {
    std::fs::read_dir(dir)
        .map(|entries| entries.flatten().filter(|e| e.path().is_dir()).count())
        .unwrap_or(0)
}

impl AstroPackService {
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        mod_repository: Arc<dyn ModRepository>,
        http_client: reqwest::Client,
        app_data_dir: PathBuf,
    ) -> Self {
        Self {
            instance_repository,
            mod_repository,
            http_client,
            app_data_dir,
        }
    }

    pub fn preview(&self, file_path: &str) -> anyhow::Result<AstroPackManifest> {
        let file = std::fs::File::open(file_path)?;
        let mut archive = zip::ZipArchive::new(file)?;
        let manifest_json = read_manifest_json(&mut archive)?;
        Ok(serde_json::from_str(&manifest_json)?)
    }

    pub fn get_export_summary(&self, instance_id: &str) -> anyhow::Result<ExportSummaryDTO> {
        let mods = self.mod_repository.find_by_instance(instance_id)?;
        let enabled: Vec<_> = mods.into_iter().filter(|m| m.enabled).collect();
        let instance_dir = paths::instance_dir(&self.app_data_dir, instance_id);

        Ok(ExportSummaryDTO {
            mods: enabled.iter().filter(|m| m.kind == "mod").count(),
            resourcepacks: enabled.iter().filter(|m| m.kind == "resourcepack").count(),
            shaders: enabled.iter().filter(|m| m.kind == "shader").count(),
            worlds: count_dirs(&instance_dir.join("saves")),
            has_notes: instance_dir.join("notes").exists()
                || instance_dir.join("notes.txt").exists(),
            has_settings: instance_dir.join("options.txt").exists(),
            servers: servers_dat::read_servers(&instance_dir.join("servers.dat"))
                .map(|s| s.len())
                .unwrap_or(0),
            screenshots: count_files(&instance_dir.join("screenshots"), "png"),
        })
    }

    /// Tries to re-resolve a fresh download URL for a Modrinth/CurseForge mod
    /// by matching the stored version display name against the project's
    /// current version list. Lets the pack stay small (link, not file) for
    /// anything that came from a real mod source; `None` means the caller
    /// should fall back to embedding the local file instead.
    async fn resolve_download_url(
        &self,
        source: &str,
        project_id: &str,
        version_name: &str,
    ) -> Option<String> {
        match source {
            "modrinth" => {
                let versions =
                    modrinth::client::get_versions(&self.http_client, project_id, None, None)
                        .await
                        .ok()?;
                let version = versions.into_iter().find(|v| v.name == version_name)?;
                version
                    .files
                    .iter()
                    .find(|f| f.primary)
                    .or_else(|| version.files.first())
                    .map(|f| f.url.clone())
            }
            "curseforge" => {
                let api_key =
                    json_settings_repository::resolve_curseforge_api_key(&self.app_data_dir)?;
                let mod_id: u32 = project_id.parse().ok()?;
                let files =
                    curseforge::client::get_files(&self.http_client, &api_key, mod_id, None, None)
                        .await
                        .ok()?;
                let file = files.into_iter().find(|f| f.display_name == version_name)?;
                file.download_url
            }
            _ => None,
        }
    }

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

        let mut contents: Vec<AstroPackContentEntry> = Vec::with_capacity(enabled_mods.len());
        for m in &enabled_mods {
            let icon_data = match &m.icon_url {
                Some(url) if !url.starts_with("data:") => icon_to_data_uri(&self.http_client, url)
                    .await
                    .or_else(|| Some(url.clone())),
                other => other.clone(),
            };

            let download_url = self
                .resolve_download_url(&m.source, &m.mod_id, &m.version)
                .await;

            let file_name = Path::new(&m.file_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            if download_url.is_none() {
                let source_path = Path::new(&m.file_path);
                if source_path.exists() {
                    embed_files.push((
                        format!("content/{}/{}", target_folder(&m.kind), file_name),
                        source_path.to_path_buf(),
                    ));
                }
            }

            contents.push(AstroPackContentEntry {
                kind: m.kind.clone(),
                source: m.source.clone(),
                project_id: m.mod_id.clone(),
                name: m.name.clone(),
                version_name: m.version.clone(),
                file_name,
                download_url,
                icon_url: icon_data,
            });
        }

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

    pub async fn import_astropack(
        &self,
        file_path: &str,
        selection: ExportSelection,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<InstanceDTO> {
        let file = std::fs::File::open(file_path)
            .with_context(|| format!("Falha ao abrir {file_path}"))?;
        let mut archive = zip::ZipArchive::new(file)
            .with_context(|| format!("Falha ao ler o zip {file_path}"))?;

        let manifest_json = read_manifest_json(&mut archive)?;
        let manifest: AstroPackManifest = serde_json::from_str(&manifest_json)?;

        let mut instance = Instance::new(manifest.name.clone(), manifest.version.clone());
        instance.loader = manifest.loader.clone();
        instance.loader_version = manifest.loader_version.clone();
        instance.java_args = manifest.java_args.clone();
        instance.min_memory = manifest.min_memory;
        instance.max_memory = manifest.max_memory;
        instance.icon_path = manifest.icon.clone();
        self.instance_repository.save(&instance)?;

        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        std::fs::create_dir_all(&instance_dir).with_context(|| {
            format!(
                "Falha ao criar pasta da instância {}",
                instance_dir.display()
            )
        })?;

        let selected_contents: Vec<_> = manifest
            .contents
            .iter()
            .filter(|entry| match entry.kind.as_str() {
                "resourcepack" => selection.resourcepacks,
                "shader" => selection.shaders,
                _ => selection.mods,
            })
            .collect();

        let world_count = if selection.worlds {
            manifest.worlds.len()
        } else {
            0
        };
        let screenshot_count = if selection.screenshots {
            manifest.screenshots.len()
        } else {
            0
        };
        let total = (selected_contents.len() + world_count + screenshot_count) as u64;
        let mut current: u64 = 0;

        for entry in &selected_contents {
            on_event(AstroPackEventDTO::Progress {
                kind: entry.kind.clone(),
                name: entry.name.clone(),
                icon_url: entry.icon_url.clone(),
                current,
                total,
            });
            current += 1;

            let target_subdir = target_folder(&entry.kind);
            let target_dir = instance_dir.join(target_subdir);
            if let Err(e) = std::fs::create_dir_all(&target_dir) {
                on_event(AstroPackEventDTO::Error {
                    message: format!("Falha ao criar pasta {}: {}", target_dir.display(), e),
                });
                continue;
            }
            let dest = target_dir.join(&entry.file_name);

            let write_result = if let Some(url) = &entry.download_url {
                crate::infrastructure::downloader::file_downloader::download_to_file(
                    &self.http_client,
                    url,
                    &dest,
                    None,
                )
                .await
                .context("baixar")
            } else {
                let zip_entry_name = format!("content/{}/{}", target_subdir, entry.file_name);
                match archive.by_name(&zip_entry_name) {
                    Ok(mut zip_entry) => std::fs::File::create(&dest)
                        .with_context(|| format!("criar {}", dest.display()))
                        .and_then(|mut out| {
                            std::io::copy(&mut zip_entry, &mut out)
                                .context("gravar conteúdo")
                                .map(|_| ())
                        }),
                    Err(e) => Err(anyhow::anyhow!("extrair {}: {}", entry.name, e)),
                }
            };

            match write_result {
                Ok(_) => {
                    let installed = InstalledMod::new(
                        instance.id.clone(),
                        entry.project_id.clone(),
                        entry.source.clone(),
                        entry.name.clone(),
                        entry.version_name.clone(),
                        dest.display().to_string(),
                        entry.icon_url.clone(),
                        entry.kind.clone(),
                    );
                    let _ = self.mod_repository.save(&installed);
                }
                Err(e) => {
                    on_event(AstroPackEventDTO::Error {
                        message: format!("Falha ao instalar {}: {}", entry.name, e),
                    });
                }
            }
        }

        if selection.settings {
            if let Some(settings) = &manifest.settings {
                let _ = std::fs::write(instance_dir.join("options.txt"), settings);
            }
        }

        if selection.notes && !manifest.notes.is_empty() {
            let notes_dir = instance_dir.join("notes");
            let _ = std::fs::create_dir_all(&notes_dir);
            for note in &manifest.notes {
                let safe_title = note.title.replace(['/', '\\'], "-");
                let _ = std::fs::write(notes_dir.join(format!("{safe_title}.md")), &note.content);
            }
        }

        if selection.worlds {
            let saves_dir = instance_dir.join("saves");
            for world_name in &manifest.worlds {
                on_event(AstroPackEventDTO::Progress {
                    kind: "world".to_string(),
                    name: world_name.clone(),
                    icon_url: None,
                    current,
                    total,
                });
                current += 1;

                let prefix = format!("content/worlds/{world_name}/");
                let entry_names: Vec<String> = (0..archive.len())
                    .filter_map(|i| archive.by_index(i).ok().map(|e| e.name().to_string()))
                    .filter(|name| name.starts_with(&prefix))
                    .collect();

                for entry_name in entry_names {
                    let relative = &entry_name[prefix.len()..];
                    let dest = saves_dir.join(world_name).join(relative);
                    if let Some(parent) = dest.parent() {
                        let _ = std::fs::create_dir_all(parent);
                    }
                    if let Ok(mut zip_entry) = archive.by_name(&entry_name) {
                        if let Ok(mut out) = std::fs::File::create(&dest) {
                            let _ = std::io::copy(&mut zip_entry, &mut out);
                        }
                    }
                }
            }
        }

        if selection.servers && !manifest.servers.is_empty() {
            let servers: Vec<ServerEntry> = manifest
                .servers
                .iter()
                .map(|s| ServerEntry {
                    name: s.name.clone(),
                    ip: s.ip.clone(),
                })
                .collect();
            let _ = servers_dat::write_servers(&instance_dir.join("servers.dat"), &servers);
        }

        if selection.screenshots {
            let shots_dir = instance_dir.join("screenshots");
            let _ = std::fs::create_dir_all(&shots_dir);
            for name in &manifest.screenshots {
                on_event(AstroPackEventDTO::Progress {
                    kind: "screenshot".to_string(),
                    name: name.clone(),
                    icon_url: None,
                    current,
                    total,
                });
                current += 1;

                let zip_entry_name = format!("content/screenshots/{name}");
                if let Ok(mut zip_entry) = archive.by_name(&zip_entry_name) {
                    if let Ok(mut out) = std::fs::File::create(shots_dir.join(name)) {
                        let _ = std::io::copy(&mut zip_entry, &mut out);
                    }
                }
            }
        }

        on_event(AstroPackEventDTO::Done {
            instance_id: instance.id.clone(),
        });

        Ok(instance_mapper::to_dto(&instance))
    }
}
