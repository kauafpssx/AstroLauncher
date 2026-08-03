use std::path::PathBuf;

use base64::Engine;

use crate::application::dto::CustomIconDTO;
use crate::infrastructure::filesystem::paths;

pub struct CustomIconService {
    app_data_dir: PathBuf,
}

impl CustomIconService {
    pub fn new(app_data_dir: PathBuf) -> Self {
        Self { app_data_dir }
    }

    /// Lists previously uploaded custom instance icons, newest first.
    pub fn list(&self) -> anyhow::Result<Vec<CustomIconDTO>> {
        let dir = paths::custom_icons_dir(&self.app_data_dir);
        if !dir.exists() {
            return Ok(Vec::new());
        }

        let mut entries: Vec<(std::time::SystemTime, CustomIconDTO)> = Vec::new();
        for entry in std::fs::read_dir(&dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) != Some("png") {
                continue;
            }
            let Some(id) = path.file_stem().and_then(|s| s.to_str()) else { continue };
            let modified = entry.metadata()?.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH);
            entries.push((modified, CustomIconDTO { id: id.to_string(), path: path.to_string_lossy().to_string() }));
        }
        entries.sort_by(|a, b| b.0.cmp(&a.0));
        Ok(entries.into_iter().map(|(_, dto)| dto).collect())
    }

    /// Decodes a base64-encoded PNG and persists it under the app's data directory.
    pub fn save(&self, base64_png: &str) -> anyhow::Result<CustomIconDTO> {
        let bytes = base64::engine::general_purpose::STANDARD.decode(base64_png.trim())?;
        let dir = paths::custom_icons_dir(&self.app_data_dir);
        std::fs::create_dir_all(&dir)?;

        let id = uuid::Uuid::new_v4().to_string();
        let path = dir.join(format!("{id}.png"));
        std::fs::write(&path, bytes)?;

        Ok(CustomIconDTO { id, path: path.to_string_lossy().to_string() })
    }

    pub fn delete(&self, id: &str) -> anyhow::Result<()> {
        if id.is_empty() || id.contains(['/', '\\', '.']) {
            anyhow::bail!("ID de ícone inválido");
        }
        let path = paths::custom_icons_dir(&self.app_data_dir).join(format!("{id}.png"));
        if path.exists() {
            std::fs::remove_file(path)?;
        }
        Ok(())
    }
}
