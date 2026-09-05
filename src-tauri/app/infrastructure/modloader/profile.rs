use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct LoaderProfile {
    #[serde(rename = "mainClass")]
    pub main_class: String,
    pub libraries: Vec<ProfileLibrary>,
    #[serde(default)]
    pub extra_game_args: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ProfileLibrary {
    pub name: String,
    pub url: String,
}

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
