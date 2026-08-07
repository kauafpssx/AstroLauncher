use std::collections::HashMap;

use serde::Serialize;

mod dto;

pub use dto::*;

fn base_url() -> &'static str {
    crate::infrastructure::config::api().modrinth.as_str()
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

/// Resolves many files at once by their sha1 hash: used to recover each
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

/// Resolves many projects' icons at once: used to fetch every modpack mod's
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
