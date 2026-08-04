use std::path::PathBuf;

use crate::application::dto::{
    GetModProjectInput, GetModVersionsInput, ModProjectDTO, ModSearchResultDTO, ModSource,
    ModVersionDTO, SearchModsInput,
};
use crate::infrastructure::persistence::config::json_settings_repository;
use crate::infrastructure::{curseforge, modrinth};

pub struct ModBrowserService {
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
}

fn curseforge_class_id(project_type: &str) -> u32 {
    match project_type {
        "modpack" => curseforge::client::CLASS_ID_MODPACK,
        "resourcepack" => curseforge::client::CLASS_ID_RESOURCE_PACK,
        "shader" => curseforge::client::CLASS_ID_SHADER,
        _ => curseforge::client::CLASS_ID_MOD,
    }
}

impl ModBrowserService {
    pub fn new(http_client: reqwest::Client, app_data_dir: PathBuf) -> Self {
        Self {
            http_client,
            app_data_dir,
        }
    }

    fn curseforge_api_key(&self) -> anyhow::Result<String> {
        json_settings_repository::resolve_curseforge_api_key(&self.app_data_dir).ok_or_else(|| {
            anyhow::anyhow!("Configure sua API key do CurseForge em Configurações antes de buscar.")
        })
    }

    pub async fn search(&self, input: SearchModsInput) -> anyhow::Result<Vec<ModSearchResultDTO>> {
        match input.source {
            ModSource::Modrinth => {
                let hits = modrinth::client::search(
                    &self.http_client,
                    &input.query,
                    &input.project_type,
                    input.game_version.as_deref(),
                    input.loader.as_deref(),
                )
                .await?;
                Ok(hits
                    .into_iter()
                    .map(|hit| ModSearchResultDTO {
                        source: ModSource::Modrinth,
                        loader: hit.primary_loader().map(str::to_string),
                        game_version: hit.latest_game_version().map(str::to_string),
                        project_id: hit.project_id,
                        name: hit.title,
                        description: hit.description,
                        icon_url: hit.icon_url,
                        downloads: hit.downloads,
                        author: hit.author,
                    })
                    .collect())
            }
            ModSource::Curseforge => {
                let api_key = self.curseforge_api_key()?;
                let class_id = curseforge_class_id(&input.project_type);
                let entries = curseforge::client::search(
                    &self.http_client,
                    &api_key,
                    &input.query,
                    class_id,
                    input.game_version.as_deref(),
                    input.loader.as_deref(),
                )
                .await?;
                Ok(entries
                    .into_iter()
                    .map(|entry| ModSearchResultDTO {
                        source: ModSource::Curseforge,
                        loader: entry.primary_loader().map(str::to_string),
                        game_version: entry.latest_game_version().map(str::to_string),
                        project_id: entry.id.to_string(),
                        name: entry.name,
                        description: entry.summary,
                        icon_url: entry.logo.map(|l| l.url),
                        downloads: entry.download_count,
                        author: entry
                            .authors
                            .first()
                            .map(|a| a.name.clone())
                            .unwrap_or_default(),
                    })
                    .collect())
            }
        }
    }

    pub async fn get_versions(
        &self,
        input: GetModVersionsInput,
    ) -> anyhow::Result<Vec<ModVersionDTO>> {
        match input.source {
            ModSource::Modrinth => {
                let versions = modrinth::client::get_versions(
                    &self.http_client,
                    &input.project_id,
                    input.game_version.as_deref(),
                    input.loader.as_deref(),
                )
                .await?;
                Ok(versions
                    .into_iter()
                    .map(|v| {
                        let primary_file = v
                            .files
                            .iter()
                            .find(|f| f.primary)
                            .or_else(|| v.files.first());
                        let required_dependency_project_ids = v
                            .dependencies
                            .iter()
                            .filter(|d| d.dependency_type == "required")
                            .filter_map(|d| d.project_id.clone())
                            .collect();
                        ModVersionDTO {
                            id: v.id,
                            name: v.name,
                            file_name: primary_file.map(|f| f.filename.clone()).unwrap_or_default(),
                            game_versions: v.game_versions,
                            download_url: primary_file.map(|f| f.url.clone()),
                            required_dependency_project_ids,
                        }
                    })
                    .collect())
            }
            ModSource::Curseforge => {
                let api_key = self.curseforge_api_key()?;
                let project_id: u32 = input
                    .project_id
                    .parse()
                    .map_err(|_| anyhow::anyhow!("ID de projeto inválido"))?;
                let files = curseforge::client::get_files(
                    &self.http_client,
                    &api_key,
                    project_id,
                    input.game_version.as_deref(),
                    input.loader.as_deref(),
                )
                .await?;
                Ok(files
                    .into_iter()
                    .map(|f| ModVersionDTO {
                        id: f.id.to_string(),
                        name: f.display_name,
                        file_name: f.file_name,
                        game_versions: f.game_versions,
                        download_url: f.download_url,
                        required_dependency_project_ids: Vec::new(),
                    })
                    .collect())
            }
        }
    }

    pub async fn get_project(&self, input: GetModProjectInput) -> anyhow::Result<ModProjectDTO> {
        match input.source {
            ModSource::Modrinth => {
                let project =
                    modrinth::client::get_project(&self.http_client, &input.project_id).await?;
                Ok(ModProjectDTO {
                    source: ModSource::Modrinth,
                    project_id: input.project_id,
                    name: project.title,
                    description: project.description,
                    body: Some(project.body),
                    icon_url: project.icon_url,
                    downloads: project.downloads,
                    source_url: project.source_url,
                    issues_url: project.issues_url,
                    wiki_url: project.wiki_url,
                    discord_url: project.discord_url,
                })
            }
            ModSource::Curseforge => {
                let api_key = self.curseforge_api_key()?;
                let project_id: u32 = input
                    .project_id
                    .parse()
                    .map_err(|_| anyhow::anyhow!("ID de projeto inválido"))?;
                let entry =
                    curseforge::client::get_mod(&self.http_client, &api_key, project_id).await?;
                let body =
                    curseforge::client::get_description(&self.http_client, &api_key, project_id)
                        .await
                        .ok();
                Ok(ModProjectDTO {
                    source: ModSource::Curseforge,
                    project_id: input.project_id,
                    name: entry.name,
                    description: entry.summary,
                    body,
                    icon_url: entry.logo.map(|l| l.url),
                    downloads: entry.download_count,
                    source_url: None,
                    issues_url: None,
                    wiki_url: None,
                    discord_url: None,
                })
            }
        }
    }
}
