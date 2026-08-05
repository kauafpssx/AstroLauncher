use std::path::PathBuf;

use crate::application::dto::{ModSearchResultDTO, ModSource, SearchModsInput};
use crate::infrastructure::persistence::config::json_settings_repository;
use crate::infrastructure::{curseforge, modrinth};

mod mod_project;

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

    pub(super) fn curseforge_api_key(&self) -> anyhow::Result<String> {
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
                    input.sort.as_deref(),
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
                    input.sort.as_deref(),
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
}
