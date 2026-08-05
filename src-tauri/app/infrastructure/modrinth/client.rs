use std::collections::HashMap;

use serde::{Deserialize, Serialize};

fn base_url() -> &'static str {
    crate::infrastructure::config::api().modrinth.as_str()
}

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
    #[serde(default)]
    pub categories: Vec<String>,
    #[serde(default)]
    pub versions: Vec<String>,
}

const LOADER_CATEGORIES: [&str; 4] = ["fabric", "forge", "quilt", "neoforge"];

impl SearchHit {
    /// Modrinth tags a modpack's loader as a regular category (alongside
    /// things like "adventure" or "technology") rather than a separate field.
    pub fn primary_loader(&self) -> Option<&str> {
        self.categories
            .iter()
            .find(|c| LOADER_CATEGORIES.contains(&c.as_str()))
            .map(|c| c.as_str())
    }

    /// The newest Minecraft version this project supports — `versions` is
    /// sorted oldest to newest, so the last entry is the most recent.
    pub fn latest_game_version(&self) -> Option<&str> {
        self.versions.last().map(String::as_str)
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct Version {
    pub id: String,
    pub project_id: String,
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

/// Maps our unified sort key to Modrinth's `index` values. Modrinth also
/// supports `"follows"`, but there's no equivalent on CurseForge's side, so
/// it's left out to keep the two providers' sort options symmetric.
fn search_index(sort: Option<&str>) -> &'static str {
    match sort {
        Some("downloads") => "downloads",
        Some("newest") => "newest",
        Some("updated") => "updated",
        _ => "relevance",
    }
}

pub async fn search(
    client: &reqwest::Client,
    query: &str,
    project_type: &str,
    game_version: Option<&str>,
    loader: Option<&str>,
    sort: Option<&str>,
) -> anyhow::Result<Vec<SearchHit>> {
    let mut facets: Vec<Vec<String>> = vec![vec![format!("project_type:{project_type}")]];
    if let Some(gv) = game_version {
        facets.push(vec![format!("versions:{gv}")]);
    }
    if let Some(l) = loader {
        facets.push(vec![format!("categories:{l}")]);
    }
    let facets_json = serde_json::to_string(&facets)?;

    let mut url = reqwest::Url::parse(&format!("{}/search", base_url()))?;
    url.query_pairs_mut()
        .append_pair("query", query)
        .append_pair("facets", &facets_json)
        .append_pair("index", search_index(sort))
        .append_pair("limit", "30");

    let response = client
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json::<SearchResponse>()
        .await?;
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
    let url = format!("{}/project/{project_id}", base_url());
    let project = client
        .get(&url)
        .send()
        .await?
        .error_for_status()?
        .json::<Project>()
        .await?;
    Ok(project)
}

pub async fn get_versions(
    client: &reqwest::Client,
    project_id: &str,
    game_version: Option<&str>,
    loader: Option<&str>,
) -> anyhow::Result<Vec<Version>> {
    let mut url = reqwest::Url::parse(&format!("{}/project/{project_id}/version", base_url()))?;
    {
        let mut pairs = url.query_pairs_mut();
        if let Some(gv) = game_version {
            pairs.append_pair("game_versions", &format!("[\"{gv}\"]"));
        }
        if let Some(l) = loader {
            pairs.append_pair("loaders", &format!("[\"{l}\"]"));
        }
    }
    let versions = client
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json::<Vec<Version>>()
        .await?;
    Ok(versions)
}

#[derive(Debug, Serialize)]
struct VersionFilesRequest<'a> {
    hashes: &'a [String],
    algorithm: &'a str,
}

/// Resolves many files at once by their sha1 hash — used to recover each
/// modpack file's project/version metadata after downloading it, since the
/// `.mrpack` manifest only lists hashes, not names.
pub async fn get_versions_by_hashes(
    client: &reqwest::Client,
    sha1_hashes: &[String],
) -> anyhow::Result<HashMap<String, Version>> {
    if sha1_hashes.is_empty() {
        return Ok(HashMap::new());
    }
    let url = format!("{}/version_files", base_url());
    let body = VersionFilesRequest {
        hashes: sha1_hashes,
        algorithm: "sha1",
    };
    let versions = client
        .post(url)
        .json(&body)
        .send()
        .await?
        .error_for_status()?
        .json::<HashMap<String, Version>>()
        .await?;
    Ok(versions)
}

#[derive(Debug, Deserialize)]
pub struct ProjectSummary {
    pub id: String,
    pub title: String,
    pub icon_url: Option<String>,
}

/// Resolves many projects' icons at once — used to fetch every modpack mod's
/// icon up front instead of one call per project.
pub async fn get_projects_by_ids(
    client: &reqwest::Client,
    project_ids: &[String],
) -> anyhow::Result<Vec<ProjectSummary>> {
    if project_ids.is_empty() {
        return Ok(Vec::new());
    }
    let ids_json = serde_json::to_string(project_ids)?;
    let mut url = reqwest::Url::parse(&format!("{}/projects", base_url()))?;
    url.query_pairs_mut().append_pair("ids", &ids_json);

    let projects = client
        .get(url)
        .send()
        .await?
        .error_for_status()?
        .json::<Vec<ProjectSummary>>()
        .await?;
    Ok(projects)
}
