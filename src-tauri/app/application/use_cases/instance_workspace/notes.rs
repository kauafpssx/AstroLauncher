use std::path::{Path, PathBuf};

use crate::application::dto::NoteDTO;
use crate::domain::errors::InstanceError;

use super::InstanceWorkspaceService;

impl InstanceWorkspaceService {
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
}
