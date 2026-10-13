use once_cell::sync::OnceCell;
use serde::{Deserialize, Serialize};

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
    pub zerotier_central: String,
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
    pub github_base: String,
    pub github_repo: String,
    pub mcstat_dashboard: String,
    pub mcstat_docs: String,
    pub curseforge_console: String,
    pub zerotier_account: String,
    pub zerotier_download_page: String,
}

impl Default for ExternalConfig {
    fn default() -> Self {
        Self {
            api: ApiConfig::default(),
            github_base: "https://github.com".into(),
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

pub fn env() -> &'static ExternalConfig {
    ENV.get()
        .expect("env config not initialized; call config::init during setup")
}

pub fn api() -> &'static ApiConfig {
    &env().api
}

#[tauri::command]
pub fn get_app_env_config() -> ExternalConfig {
    env().clone()
}
