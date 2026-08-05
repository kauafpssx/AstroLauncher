use crate::application::dto::{
    GetModProjectInput, GetModVersionsInput, ModProjectDTO, ModSource, ModVersionDTO,
};
use crate::infrastructure::{curseforge, modrinth};

use super::ModBrowserService;

impl ModBrowserService {
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
