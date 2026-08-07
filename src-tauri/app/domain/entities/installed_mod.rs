#[derive(Debug, Clone, PartialEq)]
pub struct InstalledMod {
    pub id: String,
    pub instance_id: String,
    pub mod_id: String,
    pub source: String,
    pub name: String,
    pub version: String,
    pub file_path: String,
    pub icon_url: Option<String>,
    /// `"mod"`, `"resourcepack"` or `"shader"`: shares Modrinth's own
    /// project-type vocabulary and doubles as the target subfolder key.
    pub kind: String,
    pub enabled: bool,
    pub installed_at: String,
}

impl InstalledMod {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        instance_id: String,
        mod_id: String,
        source: String,
        name: String,
        version: String,
        file_path: String,
        icon_url: Option<String>,
        kind: String,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            instance_id,
            mod_id,
            source,
            name,
            version,
            file_path,
            icon_url,
            kind,
            enabled: true,
            installed_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}

#[cfg(test)]
#[path = "tests/installed_mod_tests.rs"]
mod tests;
