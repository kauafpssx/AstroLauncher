use serde::Deserialize;

pub const FABRIC_META_BASE: &str = "https://meta.fabricmc.net/v2";
pub const QUILT_META_BASE: &str = "https://meta.quiltmc.org/v3";

#[derive(Debug, Deserialize)]
struct LoaderVersionEntry {
    loader: LoaderInfo,
}

#[derive(Debug, Deserialize)]
struct LoaderInfo {
    version: String,
    stable: bool,
}

#[derive(Debug, Deserialize)]
pub struct LoaderProfile {
    #[serde(rename = "mainClass")]
    pub main_class: String,
    pub libraries: Vec<ProfileLibrary>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ProfileLibrary {
    pub name: String,
    pub url: String,
}

/// Fabric and Quilt both expose a Fabric-Meta-compatible API (Quilt was
/// explicitly designed as a drop-in-compatible fork), so both loaders share
/// this client, parameterized by their meta server's base URL.
pub fn meta_base_for(loader: &str) -> Option<&'static str> {
    match loader {
        "fabric" => Some(FABRIC_META_BASE),
        "quilt" => Some(QUILT_META_BASE),
        _ => None,
    }
}

pub async fn fetch_latest_stable_loader_version(client: &reqwest::Client, meta_base: &str, game_version: &str) -> anyhow::Result<String> {
    let url = format!("{meta_base}/versions/loader/{game_version}");
    let entries: Vec<LoaderVersionEntry> = client.get(&url).send().await?.error_for_status()?.json().await?;
    entries
        .iter()
        .find(|e| e.loader.stable)
        .or_else(|| entries.first())
        .map(|e| e.loader.version.clone())
        .ok_or_else(|| anyhow::anyhow!("Nenhuma versão de loader disponível para Minecraft {game_version}"))
}

pub async fn fetch_profile(client: &reqwest::Client, meta_base: &str, game_version: &str, loader_version: &str) -> anyhow::Result<LoaderProfile> {
    let url = format!("{meta_base}/versions/loader/{game_version}/{loader_version}/profile/json");
    let profile: LoaderProfile = client.get(&url).send().await?.error_for_status()?.json().await?;
    Ok(profile)
}

/// Loader libraries are plain Maven coordinates with a repository base URL —
/// unlike Mojang's manifest, there's no size/sha1 provided up front.
pub fn library_download_url(library: &ProfileLibrary) -> String {
    let parts: Vec<&str> = library.name.split(':').collect();
    let (group, artifact, version) = (parts[0], parts[1], parts[2]);
    let relative = format!("{}/{}/{}/{}-{}.jar", group.replace('.', "/"), artifact, version, artifact, version);
    format!("{}/{}", library.url.trim_end_matches('/'), relative)
}
