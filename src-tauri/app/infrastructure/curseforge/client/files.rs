use super::base_url;
use super::dto::{File, FileResponse, FilesResponse};
use super::mod_loader_type;

pub async fn get_file(
    client: &reqwest::Client,
    api_key: &str,
    mod_id: u32,
    file_id: u32,
) -> anyhow::Result<File> {
    let url = format!("{}/mods/{mod_id}/files/{file_id}", base_url());
    let response = client
        .get(&url)
        .header("x-api-key", api_key)
        .send()
        .await?
        .error_for_status()?
        .json::<FileResponse>()
        .await?;
    Ok(response.data)
}

pub async fn get_files(
    client: &reqwest::Client,
    api_key: &str,
    mod_id: u32,
    game_version: Option<&str>,
    loader: Option<&str>,
) -> anyhow::Result<Vec<File>> {
    let mut url = reqwest::Url::parse(&format!("{}/mods/{mod_id}/files", base_url()))?;
    {
        let mut pairs = url.query_pairs_mut();
        pairs.append_pair("pageSize", "30");
        if let Some(gv) = game_version {
            pairs.append_pair("gameVersion", gv);
        }
        if let Some(loader_id) = loader.and_then(mod_loader_type) {
            pairs.append_pair("modLoaderType", &loader_id.to_string());
        }
    }

    let response = client
        .get(url)
        .header("x-api-key", api_key)
        .send()
        .await?
        .error_for_status()?
        .json::<FilesResponse>()
        .await?;
    Ok(response.data)
}
