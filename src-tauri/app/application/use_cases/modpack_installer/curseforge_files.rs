use std::path::PathBuf;
use std::sync::atomic::{AtomicI64, AtomicU64, Ordering};
use std::sync::Arc;

use futures::stream::{self, StreamExt};

use crate::application::dto::AstroPackEventDTO;
use crate::domain::entities::InstalledMod;
use crate::infrastructure::curseforge;
use crate::infrastructure::curseforge::modpack::ManifestFile;
use crate::infrastructure::downloader::file_downloader;

use super::{rollback_instance, ModpackInstallerService};

impl ModpackInstallerService {
    #[allow(clippy::too_many_arguments)]
    pub(super) async fn download_curseforge_files(
        &self,
        files: Vec<ManifestFile>,
        icons_by_project: std::collections::HashMap<u32, Option<String>>,
        names_by_project: std::collections::HashMap<u32, String>,
        api_key: String,
        mods_dir: PathBuf,
        instance_id: String,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<i64> {
        let total = files.len() as u64;
        let done = Arc::new(AtomicU64::new(0));
        let installed_count = Arc::new(AtomicI64::new(0));
        let results: Vec<anyhow::Result<()>> = stream::iter(files)
            .map(|file| {
                let client = self.http_client.clone();
                let api_key = api_key.clone();
                let mod_repository = self.mod_repository.clone();
                let mods_dir = mods_dir.clone();
                let instance_id = instance_id.clone();
                let on_event = on_event.clone();
                let cancelled = self.cancelled.clone();
                let done = done.clone();
                let installed_count = installed_count.clone();
                let icon_url = icons_by_project.get(&file.project_id).cloned().flatten();
                let fallback_name = names_by_project.get(&file.project_id).cloned();
                async move {
                    if cancelled.load(Ordering::SeqCst) {
                        anyhow::bail!("Instalação cancelada");
                    }
                    let resolved = curseforge::client::get_file(
                        &client,
                        &api_key,
                        file.project_id,
                        file.file_id,
                    )
                    .await?;
                    let mod_name = fallback_name.unwrap_or_else(|| resolved.display_name.clone());

                    let Some(url) = resolved.download_url else {
                        return Ok(());
                    };
                    let dest = mods_dir.join(&resolved.file_name);
                    file_downloader::download_to_file(&client, &url, &dest, None).await?;

                    let current = done.fetch_add(1, Ordering::Relaxed) + 1;
                    on_event(AstroPackEventDTO::Progress {
                        kind: "mod".to_string(),
                        name: mod_name.clone(),
                        icon_url: icon_url.clone(),
                        current,
                        total,
                    });

                    let installed = InstalledMod::new(
                        instance_id,
                        file.project_id.to_string(),
                        "curseforge".to_string(),
                        mod_name,
                        resolved.display_name,
                        dest.display().to_string(),
                        icon_url,
                        "mod".to_string(),
                    );
                    match mod_repository.save(&installed) {
                        Ok(()) => {
                            installed_count.fetch_add(1, Ordering::Relaxed);
                        }
                        Err(err) => {
                            tracing::warn!("failed to persist installed mod record: {err}");
                        }
                    }
                    Ok(())
                }
            })
            .buffer_unordered(super::FILE_CONCURRENCY)
            .collect()
            .await;

        if results.iter().any(|r| r.is_err()) {
            rollback_instance(
                self.instance_repository.as_ref(),
                &self.app_data_dir,
                &instance_id,
            );
            for result in results {
                result?;
            }
        }

        Ok(installed_count.load(Ordering::Relaxed))
    }
}
