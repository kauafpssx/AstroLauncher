use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::Context;

use crate::application::dto::{AstroPackContentEntry, AstroPackEventDTO};
use crate::domain::entities::InstalledMod;
use crate::infrastructure::filesystem::safe_path::safe_join;
use crate::infrastructure::persistence::config::json_settings_repository;
use crate::infrastructure::{curseforge, modrinth};

use super::helpers::{icon_to_data_uri, target_folder};
use super::AstroPackService;

impl AstroPackService {
    /// Tries to re-resolve a fresh download URL for a Modrinth/CurseForge mod
    /// by matching the stored version display name against the project's
    /// current version list. Lets the pack stay small (link, not file) for
    /// anything that came from a real mod source; `None` means the caller
    /// should fall back to embedding the local file instead.
    async fn resolve_download_url(
        &self,
        source: &str,
        project_id: &str,
        version_name: &str,
    ) -> Option<String> {
        match source {
            "modrinth" => {
                let versions =
                    modrinth::client::get_versions(&self.http_client, project_id, None, None)
                        .await
                        .ok()?;
                let version = versions.into_iter().find(|v| v.name == version_name)?;
                version
                    .files
                    .iter()
                    .find(|f| f.primary)
                    .or_else(|| version.files.first())
                    .map(|f| f.url.clone())
            }
            "curseforge" => {
                let api_key =
                    json_settings_repository::resolve_curseforge_api_key(&self.app_data_dir)?;
                let mod_id: u32 = project_id.parse().ok()?;
                let files =
                    curseforge::client::get_files(&self.http_client, &api_key, mod_id, None, None)
                        .await
                        .ok()?;
                let file = files.into_iter().find(|f| f.display_name == version_name)?;
                file.download_url
            }
            _ => None,
        }
    }

    /// Resolves each enabled mod into a manifest content entry, embedding the
    /// local file into `embed_files` whenever a fresh download URL can't be
    /// re-resolved from its mod source.
    pub(super) async fn collect_contents(
        &self,
        enabled_mods: &[InstalledMod],
        embed_files: &mut Vec<(String, PathBuf)>,
    ) -> Vec<AstroPackContentEntry> {
        let mut contents: Vec<AstroPackContentEntry> = Vec::with_capacity(enabled_mods.len());
        for m in enabled_mods {
            let icon_data = match &m.icon_url {
                Some(url) if !url.starts_with("data:") => icon_to_data_uri(&self.http_client, url)
                    .await
                    .or_else(|| Some(url.clone())),
                other => other.clone(),
            };

            let download_url = self
                .resolve_download_url(&m.source, &m.mod_id, &m.version)
                .await;

            let file_name = Path::new(&m.file_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();

            if download_url.is_none() {
                let source_path = Path::new(&m.file_path);
                if source_path.exists() {
                    embed_files.push((
                        format!("content/{}/{}", target_folder(&m.kind), file_name),
                        source_path.to_path_buf(),
                    ));
                }
            }

            contents.push(AstroPackContentEntry {
                kind: m.kind.clone(),
                source: m.source.clone(),
                project_id: m.mod_id.clone(),
                name: m.name.clone(),
                version_name: m.version.clone(),
                file_name,
                download_url,
                icon_url: icon_data,
            });
        }
        contents
    }

    /// Installs each selected manifest entry into the instance, downloading
    /// from its re-resolved URL when present or extracting the embedded copy
    /// from the archive otherwise, registering every success as an installed
    /// mod. `current` is advanced for the shared progress counter.
    #[allow(clippy::too_many_arguments)]
    pub(super) async fn install_contents(
        &self,
        archive: &mut zip::ZipArchive<std::fs::File>,
        instance_id: &str,
        selected_contents: &[&AstroPackContentEntry],
        instance_dir: &Path,
        on_event: &Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
        total: u64,
        current: &mut u64,
    ) {
        for entry in selected_contents {
            on_event(AstroPackEventDTO::Progress {
                kind: entry.kind.clone(),
                name: entry.name.clone(),
                icon_url: entry.icon_url.clone(),
                current: *current,
                total,
            });
            *current += 1;

            let target_subdir = target_folder(&entry.kind);
            let target_dir = instance_dir.join(target_subdir);
            if let Err(e) = std::fs::create_dir_all(&target_dir) {
                on_event(AstroPackEventDTO::Error {
                    message: format!("Falha ao criar pasta {}: {}", target_dir.display(), e),
                });
                continue;
            }
            // `file_name` comes from the pack manifest — reject `..`/absolute.
            let Some(dest) = safe_join(&target_dir, &entry.file_name) else {
                on_event(AstroPackEventDTO::Error {
                    message: format!("Caminho inválido no pacote: {}", entry.file_name),
                });
                continue;
            };

            let write_result = if let Some(url) = &entry.download_url {
                crate::infrastructure::downloader::file_downloader::download_to_file(
                    &self.http_client,
                    url,
                    &dest,
                    None,
                )
                .await
                .context("baixar")
            } else {
                let zip_entry_name = format!("content/{}/{}", target_subdir, entry.file_name);
                match archive.by_name(&zip_entry_name) {
                    Ok(mut zip_entry) => std::fs::File::create(&dest)
                        .with_context(|| format!("criar {}", dest.display()))
                        .and_then(|mut out| {
                            std::io::copy(&mut zip_entry, &mut out)
                                .context("gravar conteúdo")
                                .map(|_| ())
                        }),
                    Err(e) => Err(anyhow::anyhow!("extrair {}: {}", entry.name, e)),
                }
            };

            match write_result {
                Ok(_) => {
                    let installed = InstalledMod::new(
                        instance_id.to_string(),
                        entry.project_id.clone(),
                        entry.source.clone(),
                        entry.name.clone(),
                        entry.version_name.clone(),
                        dest.display().to_string(),
                        entry.icon_url.clone(),
                        entry.kind.clone(),
                    );
                    let _ = self.mod_repository.save(&installed);
                }
                Err(e) => {
                    on_event(AstroPackEventDTO::Error {
                        message: format!("Falha ao instalar {}: {}", entry.name, e),
                    });
                }
            }
        }
    }
}
