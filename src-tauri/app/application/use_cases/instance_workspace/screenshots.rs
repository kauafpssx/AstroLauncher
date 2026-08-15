use std::path::{Path, PathBuf};

use chrono::{DateTime, Utc};

use crate::application::dto::ScreenshotDTO;
use crate::application::validation::MAX_SCREENSHOT_NAME;
use crate::domain::errors::InstanceError;

use super::InstanceWorkspaceService;

impl InstanceWorkspaceService {
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

    /// Downscaled JPEG preview for the gallery grid — Minecraft screenshots
    /// are lossless PNGs, often several MB each at 1920x1080+; decoding and
    /// base64-transferring the full file for every thumbnail in the grid is
    /// what made the tab take seconds to show anything. The full-resolution
    /// PNG is still what `read_screenshot_data_uri` (and thus the viewer,
    /// download and clipboard-copy) uses.
    pub fn read_screenshot_thumbnail_data_uri(
        &self,
        id: &str,
        name: &str,
    ) -> Result<String, InstanceError> {
        use base64::Engine;
        const MAX_DIMENSION: u32 = 480;

        let path = self.screenshot_path(id, name)?;
        let image = image::open(&path).map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let thumbnail = image.thumbnail(MAX_DIMENSION, MAX_DIMENSION);

        let mut bytes: Vec<u8> = Vec::new();
        let mut cursor = std::io::Cursor::new(&mut bytes);
        thumbnail
            .write_to(&mut cursor, image::ImageFormat::Jpeg)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;

        let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
        Ok(format!("data:image/jpeg;base64,{encoded}"))
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
        if new_base_name.trim().chars().count() > MAX_SCREENSHOT_NAME {
            return Err(InstanceError::InvalidValue(format!(
                "screenshot name must be at most {MAX_SCREENSHOT_NAME} characters"
            )));
        }
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
}
