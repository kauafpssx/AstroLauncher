use serde::Deserialize;

/// A resolved loader install — enough to plug into `launch_instance`'s
/// download loop and `spawn_game` regardless of which loader produced it.
/// Shared by Fabric/Quilt (fetched ready-made from their meta APIs) and
/// LiteLoader (assembled by hand from its versions.json).
#[derive(Debug, Deserialize)]
pub struct LoaderProfile {
    #[serde(rename = "mainClass")]
    pub main_class: String,
    pub libraries: Vec<ProfileLibrary>,
    /// Extra `--tweakClass`-style game arguments some loaders (LiteLoader)
    /// need appended after Mojang's standard set.
    #[serde(default)]
    pub extra_game_args: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ProfileLibrary {
    pub name: String,
    pub url: String,
}

/// Loader libraries are plain Maven coordinates with a repository base URL —
/// unlike Mojang's manifest, there's no size/sha1 provided up front.
pub fn library_download_url(library: &ProfileLibrary) -> String {
    let parts: Vec<&str> = library.name.split(':').collect();
    let (group, artifact, version) = (parts[0], parts[1], parts[2]);
    let relative = format!(
        "{}/{}/{}/{}-{}.jar",
        group.replace('.', "/"),
        artifact,
        version,
        artifact,
        version
    );
    format!("{}/{}", library.url.trim_end_matches('/'), relative)
}
