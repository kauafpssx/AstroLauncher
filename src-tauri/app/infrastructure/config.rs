use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};

/// External API endpoints and shared links, sourced from
/// `plugins.env` in `tauri.conf.json` (the source of truth). The defaults
/// below are only a safety net if the key is ever removed from the file.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ApiConfig {
    pub curseforge: String,
    pub mcstat: String,
    pub playermc: String,
    pub modrinth: String,
    pub mojang_manifest: String,
    pub mojang_assets: String,
    pub adoptium: String,
    pub fabric_meta: String,
    pub quilt_meta: String,
    pub liteloader_versions: String,
    pub liteloader_repo: String,
    pub maven_central: String,
    /// ZeroTier Central API base URL (network/member management).
    pub zerotier_central: String,
    /// Official ZeroTier One installer (MSI) for Windows.
    pub zerotier_download: String,
}

impl Default for ApiConfig {
    fn default() -> Self {
        Self {
            curseforge: "https://api.curseforge.com/v1".into(),
            mcstat: "https://mcstat.org/api/v1".into(),
            playermc: "https://api.playermc.site/v1".into(),
            modrinth: "https://api.modrinth.com/v2".into(),
            mojang_manifest: "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json"
                .into(),
            mojang_assets: "https://resources.download.minecraft.net".into(),
            adoptium: "https://api.adoptium.net/v3".into(),
            fabric_meta: "https://meta.fabricmc.net/v2".into(),
            quilt_meta: "https://meta.quiltmc.org/v3".into(),
            liteloader_versions: "https://dl.liteloader.com/versions/versions.json".into(),
            liteloader_repo: "https://repo.liteloader.com/".into(),
            maven_central: "https://repo1.maven.org/maven2/".into(),
            zerotier_central: "https://api.zerotier.com/api/v1".into(),
            zerotier_download: "https://download.zerotier.com/dist/ZeroTier%20One.msi".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ExternalConfig {
    pub api: ApiConfig,
    pub github_repo: String,
    pub mcstat_dashboard: String,
    pub mcstat_docs: String,
    pub curseforge_console: String,
    /// ZeroTier Central account page where users generate their API token.
    pub zerotier_account: String,
    /// ZeroTier download page (manual install fallback).
    pub zerotier_download_page: String,
}

impl Default for ExternalConfig {
    fn default() -> Self {
        Self {
            api: ApiConfig::default(),
            github_repo: "kauafpssx/AstroLauncher".into(),
            mcstat_dashboard: "https://mcstat.org/dashboard/api-keys".into(),
            mcstat_docs: "https://mcstat.org/api-docs".into(),
            curseforge_console: "https://console.curseforge.com/".into(),
            zerotier_account: "https://my.zerotier.com/account".into(),
            zerotier_download_page: "https://www.zerotier.com/download/".into(),
        }
    }
}

static ENV: OnceCell<ExternalConfig> = OnceCell::new();

/// Loads the `plugins.env` block from the Tauri config into a process-wide
/// global. Must be called once during setup, before any command runs.
pub fn init(config: &tauri::Config) {
    let external: ExternalConfig = config
        .plugins
        .0
        .get("env")
        .cloned()
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();
    let _ = ENV.set(external);
}

/// The resolved external config, falling back to defaults when unset.
pub fn env() -> &'static ExternalConfig {
    ENV.get()
        .expect("env config not initialized; call config::init during setup")
}

/// Convenience accessor for the API endpoint block.
pub fn api() -> &'static ApiConfig {
    &env().api
}

/// Exposes the resolved external config to the frontend (repo link, docs
/// URLs, API endpoints) so the UI never hardcodes a URL either.
#[tauri::command]
pub fn get_app_env_config() -> ExternalConfig {
    env().clone()
}
