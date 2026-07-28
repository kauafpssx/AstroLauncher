use serde::Deserialize;

const BASE_URL: &str = "https://api.modrinth.com/v2";

#[derive(Debug, Deserialize)]
pub struct SearchResponse {
    pub hits: Vec<SearchHit>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SearchHit {
    pub project_id: String,
    pub title: String,
    pub description: String,
    pub icon_url: Option<String>,
    pub downloads: u64,
    pub author: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Version {
    pub id: String,
    pub name: String,
    pub version_number: String,
    pub game_versions: Vec<String>,
    pub loaders: Vec<String>,
    pub files: Vec<VersionFile>,
    #[serde(default)]
    pub dependencies: Vec<Dependency>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct VersionFile {
    pub url: String,
    pub filename: String,
    pub primary: bool,
    pub size: u64,
    pub hashes: FileHashes,
}

#[derive(Debug, Deserialize, Clone)]
pub struct FileHashes {
    pub sha1: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Dependency {
    pub project_id: Option<String>,
    pub dependency_type: String,
}

pub async fn search(
    client: &reqwest::Client,
    query: &str,
    project_type: &str,
    game_version: Option<&str>,
    loader: Option<&str>,
) -> anyhow::Result<Vec<SearchHit>> {
    let mut facets: Vec<Vec<String>> = vec![vec![format!("project_type:{project_type}")]];
    if let Some(gv) = game_version {
        facets.push(vec![format!("versions:{gv}")]);
    }
    if let Some(l) = loader {
        facets.push(vec![format!("categories:{l}")]);
    }
    let facets_json = serde_json::to_string(&facets)?;

    let mut url = reqwest::Url::parse(&format!("{BASE_URL}/search"))?;
    url.query_pairs_mut()
        .append_pair("query", query)
        .append_pair("facets", &facets_json)
        .append_pair("limit", "30");

    let response = client.get(url).send().await?.error_for_status()?.json::<SearchResponse>().await?;
    Ok(response.hits)
}

#[derive(Debug, Deserialize, Clone)]
pub struct Project {
    pub title: String,
    pub description: String,
    pub body: String,
    pub icon_url: Option<String>,
    pub downloads: u64,
    pub source_url: Option<String>,
    pub issues_url: Option<String>,
    pub wiki_url: Option<String>,
    pub discord_url: Option<String>,
}

pub async fn get_project(client: &reqwest::Client, project_id: &str) -> anyhow::Result<Project> {
    let url = format!("{BASE_URL}/project/{project_id}");
    let project = client.get(&url).send().await?.error_for_status()?.json::<Project>().await?;
    Ok(project)
}

pub async fn get_versions(
    client: &reqwest::Client,
    project_id: &str,
    game_version: Option<&str>,
    loader: Option<&str>,
) -> anyhow::Result<Vec<Version>> {
    let mut url = reqwest::Url::parse(&format!("{BASE_URL}/project/{project_id}/version"))?;
    {
        let mut pairs = url.query_pairs_mut();
        if let Some(gv) = game_version {
            pairs.append_pair("game_versions", &format!("[\"{gv}\"]"));
        }
        if let Some(l) = loader {
            pairs.append_pair("loaders", &format!("[\"{l}\"]"));
        }
    }
    let versions = client.get(url).send().await?.error_for_status()?.json::<Vec<Version>>().await?;
    Ok(versions)
}
