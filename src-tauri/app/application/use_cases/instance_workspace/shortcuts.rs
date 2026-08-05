use crate::domain::errors::InstanceError;
use crate::infrastructure::filesystem::shortcut;

use super::InstanceWorkspaceService;

impl InstanceWorkspaceService {
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
}
