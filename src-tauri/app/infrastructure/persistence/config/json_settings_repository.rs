use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LauncherSettings {
    pub curseforge_api_key: Option<String>,
    #[serde(default)]
    pub mcstat_api_key: Option<String>,
    #[serde(default)]
    pub root_group_name: Option<String>,
    #[serde(default)]
    pub root_group_icon: Option<String>,
    #[serde(default)]
    pub zerotier_api_token: Option<String>,
}

fn settings_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("settings.json")
}

pub fn read(app_data_dir: &Path) -> LauncherSettings {
    std::fs::read_to_string(settings_path(app_data_dir))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn write(app_data_dir: &Path, settings: &LauncherSettings) -> anyhow::Result<()> {
    let path = settings_path(app_data_dir);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(&path, serde_json::to_string_pretty(settings)?)?;
    Ok(())
}

/// Resolves the CurseForge API key: first the one configured by the user in
/// settings.json, falling back to the key baked in at build time via the
/// `CURSEFORGE_API_KEY` env var (set from a GitHub Actions secret, so it is
/// never committed or logged). Returns `None` when neither is available.
pub fn resolve_curseforge_api_key(app_data_dir: &Path) -> Option<String> {
    let configured = read(app_data_dir)
        .curseforge_api_key
        .filter(|k| !k.trim().is_empty());
    configured.or_else(build_time_curseforge_api_key)
}

fn build_time_curseforge_api_key() -> Option<String> {
    option_env!("CURSEFORGE_API_KEY")
        .map(str::to_string)
        .filter(|k| !k.trim().is_empty())
}

/// Resolves the mcstat.org API key: user-configured first, falling back to
/// the key baked in at build time via the `MCSTAT_API_KEY` env var.
pub fn resolve_mcstat_api_key(app_data_dir: &Path) -> Option<String> {
    let configured = read(app_data_dir)
        .mcstat_api_key
        .filter(|k| !k.trim().is_empty());
    configured.or_else(build_time_mcstat_api_key)
}

fn build_time_mcstat_api_key() -> Option<String> {
    option_env!("MCSTAT_API_KEY")
        .map(str::to_string)
        .filter(|k| !k.trim().is_empty())
}

/// Resolves the ZeroTier Central personal API token: user-configured only,
/// no build-time fallback (this is a per-user secret, not a build secret).
pub fn resolve_zerotier_api_token(app_data_dir: &Path) -> Option<String> {
    read(app_data_dir)
        .zerotier_api_token
        .filter(|k| !k.trim().is_empty())
}
