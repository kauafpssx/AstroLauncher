use std::path::{Path, PathBuf};
use std::sync::Arc;

use chrono::{DateTime, Utc};

use crate::application::dto::{ConfigFileDTO, NoteDTO, ScreenshotDTO, ServerEntryDTO, WorldDTO};
use crate::domain::errors::InstanceError;
use crate::domain::repositories::InstanceRepository;
use crate::infrastructure::filesystem::{paths, shortcut};
use crate::infrastructure::minecraft::servers_dat::{self, ServerEntry};

/// Filesystem-backed operations scoped to a single instance's workspace
/// (log file, notes, saved worlds). Grouped together since none of these
/// carry real domain logic beyond "does this instance exist".
pub struct InstanceWorkspaceService {
    instance_repository: Arc<dyn InstanceRepository>,
    app_data_dir: PathBuf,
}

impl InstanceWorkspaceService {
    pub fn new(instance_repository: Arc<dyn InstanceRepository>, app_data_dir: PathBuf) -> Self {
        Self {
            instance_repository,
            app_data_dir,
        }
    }

    fn instance_dir(&self, id: &str) -> Result<PathBuf, InstanceError> {
        self.instance_repository.find_by_id(id)?;
        Ok(paths::instance_dir(&self.app_data_dir, id))
    }

    pub fn read_log(&self, id: &str) -> Result<String, InstanceError> {
        let log_path = self.instance_dir(id)?.join("logs").join("latest.log");
        Ok(std::fs::read_to_string(&log_path).unwrap_or_default())
    }

    /// Notes live as individual `.md` files under `notes/` — the file name
    /// (sans extension) is both the note's id and its title. A lone legacy
    /// `notes.txt` (pre-multi-note) is migrated in transparently the first
    /// time the list is read.
    fn notes_dir(&self, id: &str) -> Result<PathBuf, InstanceError> {
        let instance_dir = self.instance_dir(id)?;
        let notes_dir = instance_dir.join("notes");
        if !notes_dir.exists() {
            let legacy = instance_dir.join("notes.txt");
            std::fs::create_dir_all(&notes_dir)
                .map_err(|e| InstanceError::Persistence(e.to_string()))?;
            if let Ok(legacy_content) = std::fs::read_to_string(&legacy) {
                if !legacy_content.trim().is_empty() {
                    let _ = std::fs::write(notes_dir.join("Nota 1.md"), legacy_content);
                }
            }
        }
        Ok(notes_dir)
    }

    fn note_path(&self, id: &str, note_id: &str) -> Result<PathBuf, InstanceError> {
        if note_id.is_empty()
            || note_id.contains("..")
            || note_id.contains('/')
            || note_id.contains('\\')
        {
            return Err(InstanceError::InvalidName(note_id.to_string()));
        }
        Ok(self.notes_dir(id)?.join(format!("{note_id}.md")))
    }

    pub fn list_notes(&self, id: &str) -> Result<Vec<NoteDTO>, InstanceError> {
        let dir = self.notes_dir(id)?;
        let mut notes = Vec::new();
        let entries =
            std::fs::read_dir(&dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("md") {
                continue;
            }
            let Some(title) = path.file_stem().and_then(|s| s.to_str()) else {
                continue;
            };
            notes.push(NoteDTO {
                id: title.to_string(),
                title: title.to_string(),
            });
        }
        notes.sort_by_key(|a| a.title.to_lowercase());

        if notes.is_empty() {
            std::fs::write(dir.join("Nota 1.md"), "")
                .map_err(|e| InstanceError::Persistence(e.to_string()))?;
            notes.push(NoteDTO {
                id: "Nota 1".to_string(),
                title: "Nota 1".to_string(),
            });
        }
        Ok(notes)
    }

    pub fn read_note(&self, id: &str, note_id: &str) -> Result<String, InstanceError> {
        let path = self.note_path(id, note_id)?;
        Ok(std::fs::read_to_string(&path).unwrap_or_default())
    }

    pub fn write_note(&self, id: &str, note_id: &str, content: &str) -> Result<(), InstanceError> {
        let path = self.note_path(id, note_id)?;
        std::fs::write(path, content).map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    /// Finds a `<base> N.md`-style name that doesn't collide with an
    /// existing note — shared by note creation and renaming.
    fn unique_note_title(&self, dir: &Path, base: &str) -> String {
        let base = if base.trim().is_empty() {
            "Nova Nota"
        } else {
            base.trim()
        };
        if !dir.join(format!("{base}.md")).exists() {
            return base.to_string();
        }
        let mut n = 2;
        loop {
            let candidate = format!("{base} {n}");
            if !dir.join(format!("{candidate}.md")).exists() {
                return candidate;
            }
            n += 1;
        }
    }

    pub fn create_note(&self, id: &str, title: &str) -> Result<NoteDTO, InstanceError> {
        let dir = self.notes_dir(id)?;
        let title = self.unique_note_title(&dir, title);
        std::fs::write(dir.join(format!("{title}.md")), "")
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(NoteDTO {
            id: title.clone(),
            title,
        })
    }

    pub fn rename_note(
        &self,
        id: &str,
        note_id: &str,
        new_title: &str,
    ) -> Result<NoteDTO, InstanceError> {
        let source = self.note_path(id, note_id)?;
        let dir = self.notes_dir(id)?;
        let new_title = self.unique_note_title(&dir, new_title);
        let dest = dir.join(format!("{new_title}.md"));
        std::fs::rename(&source, &dest).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(NoteDTO {
            id: new_title.clone(),
            title: new_title,
        })
    }

    pub fn delete_note(&self, id: &str, note_id: &str) -> Result<(), InstanceError> {
        let path = self.note_path(id, note_id)?;
        if path.exists() {
            std::fs::remove_file(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        Ok(())
    }

    pub fn open_folder(&self, id: &str) -> Result<(), InstanceError> {
        let dir = self.instance_dir(id)?;
        std::fs::create_dir_all(&dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        std::process::Command::new("explorer")
            .arg(&dir)
            .spawn()
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }

    /// Desktop shortcuts for every instance, keyed by instance id. The
    /// frontend derives the per-instance toggle state from this list.
    pub fn list_shortcut_ids(&self) -> Result<Vec<String>, InstanceError> {
        shortcut::list_instance_ids().map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    /// Resolves an instance's icon into raw PNG bytes for the shortcut.
    /// `icon_path` is either a data URI, an absolute filesystem path to a
    /// custom upload (both readable straight from Rust — no webview round
    /// trip needed), or a bundled preset under `/picker/...` served by the
    /// webview, which only the frontend can fetch — `picker_png_base64` is
    /// its answer for that case.
    fn resolve_shortcut_icon(
        icon_path: Option<&str>,
        picker_png_base64: Option<&str>,
    ) -> anyhow::Result<Option<Vec<u8>>> {
        use base64::Engine;
        let Some(path) = icon_path else {
            return Ok(None);
        };

        if let Some(data) = path.strip_prefix("data:") {
            let b64 = data.split_once(',').map(|(_, encoded)| encoded);
            return b64
                .map(|b| base64::engine::general_purpose::STANDARD.decode(b.trim()))
                .transpose()
                .map_err(Into::into);
        }
        if path.starts_with("/picker/") {
            return picker_png_base64
                .map(|b| base64::engine::general_purpose::STANDARD.decode(b.trim()))
                .transpose()
                .map_err(Into::into);
        }
        Ok(Some(std::fs::read(path)?))
    }

    /// Creates the instance's desktop shortcut if absent, removes it if
    /// present. Returns the new state (`true` = shortcut exists).
    pub fn toggle_shortcut(
        &self,
        id: &str,
        picker_icon_png_base64: Option<&str>,
    ) -> Result<bool, InstanceError> {
        let instance = self.instance_repository.find_by_id(id)?;
        let persistence = |e: anyhow::Error| InstanceError::Persistence(e.to_string());

        let existing = shortcut::list_instance_ids().map_err(persistence)?;
        if existing.iter().any(|existing_id| existing_id == id) {
            shortcut::remove_by_id(id).map_err(persistence)?;
            Ok(false)
        } else {
            let icon_png =
                Self::resolve_shortcut_icon(instance.icon_path.as_deref(), picker_icon_png_base64)
                    .map_err(persistence)?;
            shortcut::create(
                &instance.id,
                &instance.name,
                icon_png.as_deref(),
                &self.app_data_dir,
            )
            .map_err(persistence)?;
            Ok(true)
        }
    }

    /// Re-creates the instance's shortcut with its current icon — a no-op if
    /// no shortcut exists. Called after the icon changes so an existing
    /// shortcut picks it up without the user having to toggle it off/on.
    pub fn refresh_shortcut_icon(
        &self,
        id: &str,
        picker_icon_png_base64: Option<&str>,
    ) -> Result<(), InstanceError> {
        let instance = self.instance_repository.find_by_id(id)?;
        let persistence = |e: anyhow::Error| InstanceError::Persistence(e.to_string());

        let existing = shortcut::list_instance_ids().map_err(persistence)?;
        if !existing.iter().any(|existing_id| existing_id == id) {
            return Ok(());
        }
        let icon_png =
            Self::resolve_shortcut_icon(instance.icon_path.as_deref(), picker_icon_png_base64)
                .map_err(persistence)?;
        shortcut::create(
            &instance.id,
            &instance.name,
            icon_png.as_deref(),
            &self.app_data_dir,
        )
        .map_err(persistence)
    }

    pub fn list_worlds(&self, id: &str) -> Result<Vec<WorldDTO>, InstanceError> {
        let saves_dir = self.instance_dir(id)?.join("saves");
        if !saves_dir.exists() {
            return Ok(Vec::new());
        }

        let mut worlds = Vec::new();
        let entries =
            std::fs::read_dir(&saves_dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            let size_bytes = dir_size(&path);
            let last_modified = std::fs::metadata(&path)
                .and_then(|m| m.modified())
                .ok()
                .map(|t| DateTime::<Utc>::from(t).to_rfc3339());

            worlds.push(WorldDTO {
                name,
                size_bytes,
                last_modified,
            });
        }
        Ok(worlds)
    }

    pub fn delete_world(&self, id: &str, world_name: &str) -> Result<(), InstanceError> {
        if world_name.is_empty()
            || world_name.contains("..")
            || world_name.contains('/')
            || world_name.contains('\\')
        {
            return Err(InstanceError::InvalidName(world_name.to_string()));
        }

        let world_dir = self.instance_dir(id)?.join("saves").join(world_name);
        if world_dir.exists() {
            std::fs::remove_dir_all(&world_dir)
                .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        Ok(())
    }

    fn servers_dat_path(&self, id: &str) -> Result<PathBuf, InstanceError> {
        Ok(self.instance_dir(id)?.join("servers.dat"))
    }

    pub fn list_servers(&self, id: &str) -> Result<Vec<ServerEntryDTO>, InstanceError> {
        let path = self.servers_dat_path(id)?;
        let servers = servers_dat::read_servers(&path)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(servers
            .into_iter()
            .enumerate()
            .map(|(index, s)| ServerEntryDTO {
                index,
                name: s.name,
                ip: s.ip,
            })
            .collect())
    }

    pub fn add_server(&self, id: &str, name: &str, ip: &str) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        servers.push(ServerEntry {
            name: name.to_string(),
            ip: ip.to_string(),
        });
        servers_dat::write_servers(&path, &servers)
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn update_server(
        &self,
        id: &str,
        index: usize,
        name: &str,
        ip: &str,
    ) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let entry = servers
            .get_mut(index)
            .ok_or_else(|| InstanceError::InvalidName(index.to_string()))?;
        entry.name = name.to_string();
        entry.ip = ip.to_string();
        servers_dat::write_servers(&path, &servers)
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn delete_server(&self, id: &str, index: usize) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        if index >= servers.len() {
            return Err(InstanceError::InvalidName(index.to_string()));
        }
        servers.remove(index);
        servers_dat::write_servers(&path, &servers)
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    fn screenshot_path(&self, id: &str, name: &str) -> Result<PathBuf, InstanceError> {
        if name.is_empty() || name.contains("..") || name.contains('/') || name.contains('\\') {
            return Err(InstanceError::InvalidName(name.to_string()));
        }
        Ok(self.instance_dir(id)?.join("screenshots").join(name))
    }

    pub fn list_screenshots(&self, id: &str) -> Result<Vec<ScreenshotDTO>, InstanceError> {
        let dir = self.instance_dir(id)?.join("screenshots");
        if !dir.exists() {
            return Ok(Vec::new());
        }

        let mut shots = Vec::new();
        let entries =
            std::fs::read_dir(&dir).map_err(|e| InstanceError::Persistence(e.to_string()))?;
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
            let metadata = std::fs::metadata(&path).ok();
            let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
            let taken_at = metadata
                .and_then(|m| m.modified().ok())
                .map(|t| DateTime::<Utc>::from(t).to_rfc3339());
            shots.push(ScreenshotDTO {
                name,
                size_bytes,
                taken_at,
            });
        }
        shots.sort_by(|a, b| b.taken_at.cmp(&a.taken_at));
        Ok(shots)
    }

    pub fn read_screenshot_data_uri(&self, id: &str, name: &str) -> Result<String, InstanceError> {
        use base64::Engine;
        let path = self.screenshot_path(id, name)?;
        let bytes = std::fs::read(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
        Ok(format!("data:image/png;base64,{encoded}"))
    }

    pub fn delete_screenshot(&self, id: &str, name: &str) -> Result<(), InstanceError> {
        let path = self.screenshot_path(id, name)?;
        if path.exists() {
            std::fs::remove_file(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        Ok(())
    }

    /// Renames only the base name, keeping the original file extension intact.
    pub fn rename_screenshot(
        &self,
        id: &str,
        name: &str,
        new_base_name: &str,
    ) -> Result<String, InstanceError> {
        if new_base_name.is_empty()
            || new_base_name.contains("..")
            || new_base_name.contains('/')
            || new_base_name.contains('\\')
        {
            return Err(InstanceError::InvalidName(new_base_name.to_string()));
        }

        let source = self.screenshot_path(id, name)?;
        let ext = Path::new(name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("png");
        let new_name = format!("{new_base_name}.{ext}");
        if new_name == name {
            return Ok(new_name);
        }

        let dest = self.screenshot_path(id, &new_name)?;
        if dest.exists() {
            return Err(InstanceError::Persistence(
                "Já existe uma screenshot com esse nome".to_string(),
            ));
        }

        std::fs::rename(&source, &dest).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(new_name)
    }

    pub fn save_screenshot_as(
        &self,
        id: &str,
        name: &str,
        dest_path: &str,
    ) -> Result<(), InstanceError> {
        let source = self.screenshot_path(id, name)?;
        std::fs::copy(&source, dest_path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }

    /// Resolves a `/`-separated relative path against the instance directory,
    /// rejecting anything that would escape it (`..`, absolute paths).
    fn config_file_path(&self, id: &str, relative_path: &str) -> Result<PathBuf, InstanceError> {
        if relative_path
            .split(['/', '\\'])
            .any(|part| part.is_empty() || part == "..")
        {
            return Err(InstanceError::InvalidName(relative_path.to_string()));
        }
        Ok(self.instance_dir(id)?.join(relative_path))
    }

    /// `options.txt`/`optionsof.txt` (Minecraft's own settings) plus every
    /// file under `config/` (where mods keep theirs) — the practical surface
    /// a "config editor" needs, without special-casing individual mods.
    pub fn list_config_files(&self, id: &str) -> Result<Vec<ConfigFileDTO>, InstanceError> {
        let instance_dir = self.instance_dir(id)?;
        let mut files = Vec::new();

        for name in ["options.txt", "optionsof.txt"] {
            let path = instance_dir.join(name);
            if let Ok(metadata) = std::fs::metadata(&path) {
                files.push(ConfigFileDTO {
                    path: name.to_string(),
                    size_bytes: metadata.len(),
                });
            }
        }

        let config_dir = instance_dir.join("config");
        if config_dir.exists() {
            for entry in walkdir::WalkDir::new(&config_dir)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if !entry.file_type().is_file() {
                    continue;
                }
                let Ok(relative) = entry.path().strip_prefix(&instance_dir) else {
                    continue;
                };
                let Some(size_bytes) = entry.metadata().ok().map(|m| m.len()) else {
                    continue;
                };
                files.push(ConfigFileDTO {
                    path: relative.to_string_lossy().replace('\\', "/"),
                    size_bytes,
                });
            }
        }

        Ok(files)
    }

    pub fn read_config_file(&self, id: &str, relative_path: &str) -> Result<String, InstanceError> {
        let path = self.config_file_path(id, relative_path)?;
        std::fs::read_to_string(&path).map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn write_config_file(
        &self,
        id: &str,
        relative_path: &str,
        content: &str,
    ) -> Result<(), InstanceError> {
        let path = self.config_file_path(id, relative_path)?;
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        std::fs::write(path, content).map_err(|e| InstanceError::Persistence(e.to_string()))
    }
}

fn dir_size(path: &Path) -> u64 {
    walkdir::WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| e.metadata().ok())
        .map(|m| m.len())
        .sum()
}
