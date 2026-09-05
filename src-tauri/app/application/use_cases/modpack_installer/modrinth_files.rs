use std::path::PathBuf;
use std::sync::atomic::{AtomicI64, AtomicU64, Ordering};
use std::sync::Arc;

use futures::stream::{self, StreamExt};

use crate::application::dto::AstroPackEventDTO;
use crate::domain::entities::InstalledMod;
use crate::infrastructure::downloader::file_downloader;
use crate::infrastructure::filesystem::safe_path::safe_join;
use crate::infrastructure::modrinth::{self, mrpack};

use super::{rollback_instance, ModpackInstallerService};

fn kind_for_mrpack_path(path: &str) -> Option<&'static str> {
    if path.starts_with("mods/") {
        Some("mod")
    } else if path.starts_with("resourcepacks/") {
        Some("resourcepack")
    } else if path.starts_with("shaderpacks/") {
        Some("shader")
    } else {
        None
    }
}

impl ModpackInstallerService {
    #[allow(clippy::too_many_arguments)]
    pub(super) async fn download_modrinth_files(
        &self,
        downloadable: Vec<mrpack::PackFile>,
        versions_by_hash: std::collections::HashMap<String, modrinth::client::Version>,
        icons_by_project: std::collections::HashMap<String, Option<String>>,
        titles_by_project: std::collections::HashMap<String, String>,
        instance_dir: PathBuf,
        instance_id: String,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<i64> {
        let total = downloadable.len() as u64;
        let done = Arc::new(AtomicU64::new(0));
        let installed_count = Arc::new(AtomicI64::new(0));
        let results: Vec<anyhow::Result<()>> = stream::iter(downloadable)
            .map(|file| {
                let client = self.http_client.clone();
                let mod_repository = self.mod_repository.clone();
                let instance_dir = instance_dir.clone();
                let instance_id = instance_id.clone();
                let on_event = on_event.clone();
                let cancelled = self.cancelled.clone();
                let done = done.clone();
                let installed_count = installed_count.clone();
                let version = versions_by_hash.get(&file.hashes.sha1).cloned();
                let icon_url = version
                    .as_ref()
                    .and_then(|v| icons_by_project.get(&v.project_id).cloned().flatten());
                let name = version
                    .as_ref()
                    .and_then(|v| titles_by_project.get(&v.project_id).cloned())
                    .or_else(|| version.as_ref().map(|v| v.name.clone()))
                    .unwrap_or_else(|| {
                        file.path
                            .rsplit('/')
                            .next()
                            .unwrap_or(&file.path)
                            .to_string()
                    });
                async move {
                    if cancelled.load(Ordering::SeqCst) {
                        anyhow::bail!("Instalação cancelada");
                    }
                    let Some(url) = file.downloads.first() else {
                        done.fetch_add(1, Ordering::Relaxed);
                        return Ok(());
                    };
                    let Some(dest) = safe_join(&instance_dir, &file.path) else {
                        done.fetch_add(1, Ordering::Relaxed);
                        return Ok(());
                    };
                    file_downloader::download_to_file(&client, url, &dest, Some(&file.hashes.sha1))
                        .await?;

                    let current = done.fetch_add(1, Ordering::Relaxed) + 1;
                    on_event(AstroPackEventDTO::Progress {
                        kind: "mod".to_string(),
                        name: name.clone(),
                        icon_url: icon_url.clone(),
                        current,
                        total,
                    });

                    if let (Some(kind), Some(version)) = (kind_for_mrpack_path(&file.path), version)
                    {
                        let installed = InstalledMod::new(
                            instance_id,
                            version.project_id,
                            "modrinth".to_string(),
                            name,
                            version.version_number,
                            dest.display().to_string(),
                            icon_url,
                            kind.to_string(),
                        );
                        if let Err(err) = mod_repository.save(&installed) {
                            tracing::warn!("failed to persist installed mod record: {err}");
                        } else {
                            installed_count.fetch_add(1, Ordering::Relaxed);
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
