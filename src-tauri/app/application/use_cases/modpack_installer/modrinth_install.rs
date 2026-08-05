use std::sync::atomic::Ordering;
use std::sync::Arc;

use crate::application::dto::{AstroPackEventDTO, InstallModpackInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::domain::entities::{InstalledMod, Instance};
use crate::infrastructure::downloader::file_downloader;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::filesystem::safe_path::safe_join;
use crate::infrastructure::modrinth::{self, mrpack};

use super::{rollback_instance, ModpackInstallerService};

/// Maps a `.mrpack` file's path prefix to the content kind used by our mod
/// registry — files outside these folders (e.g. `config/`) aren't installed
/// content and shouldn't show up in the mods list.
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
    /// Downloads a Modrinth `.mrpack`, derives the Minecraft version/loader
    /// from its `dependencies` block, creates a new instance, downloads every
    /// referenced file and extracts the `overrides/` folder into it.
    pub async fn install_modrinth_modpack(
        &self,
        input: InstallModpackInput,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<InstanceDTO> {
        self.cancelled.store(false, Ordering::SeqCst);
        let _presence = self
            .discord
            .guard("Instalando modpack", input.instance_name.clone());

        let bytes = self
            .http_client
            .get(&input.download_url)
            .send()
            .await?
            .error_for_status()?
            .bytes()
            .await?
            .to_vec();

        let index = mrpack::read_index(&bytes)?;

        let mc_version = index
            .dependencies
            .get("minecraft")
            .cloned()
            .ok_or_else(|| anyhow::anyhow!("Modpack não especifica uma versão do Minecraft"))?;

        let (loader, loader_version) = ["fabric-loader", "quilt-loader", "forge", "neoforge"]
            .iter()
            .find_map(|key| {
                index
                    .dependencies
                    .get(*key)
                    .map(|v| (loader_id_for(key), v.clone()))
            })
            .map(|(id, v)| (Some(id), Some(v)))
            .unwrap_or((None, None));

        let mut instance = Instance::new(input.instance_name, mc_version);
        instance.loader = loader;
        instance.loader_version = loader_version;
        instance.folder_id = input.folder_id;
        instance.icon_path = self.download_icon(&input.icon_url).await;
        self.instance_repository.save(&instance)?;

        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        std::fs::create_dir_all(&instance_dir)?;

        let downloadable: Vec<_> = index
            .files
            .iter()
            .filter(|f| f.is_client_supported())
            .collect();

        // Resolve every file's project metadata (name/version/icon) from its
        // hash *before* downloading — the `.mrpack` manifest only lists
        // hashes, and we want icons available for the progress events too,
        // not just after the fact.
        let hashes: Vec<String> = downloadable.iter().map(|f| f.hashes.sha1.clone()).collect();
        let versions_by_hash = modrinth::client::get_versions_by_hashes(&self.http_client, &hashes)
            .await
            .unwrap_or_default();
        let project_ids: Vec<String> = {
            let mut ids: Vec<String> = versions_by_hash
                .values()
                .map(|v| v.project_id.clone())
                .collect();
            ids.sort_unstable();
            ids.dedup();
            ids
        };
        let mut icons_by_project: std::collections::HashMap<String, Option<String>> =
            std::collections::HashMap::new();
        let mut titles_by_project: std::collections::HashMap<String, String> =
            std::collections::HashMap::new();
        for project in modrinth::client::get_projects_by_ids(&self.http_client, &project_ids)
            .await
            .unwrap_or_default()
        {
            icons_by_project.insert(project.id.clone(), project.icon_url);
            titles_by_project.insert(project.id, project.title);
        }

        let total = downloadable.len() as u64;
        for (i, file) in downloadable.into_iter().enumerate() {
            if self.cancelled.load(Ordering::SeqCst) {
                rollback_instance(
                    self.instance_repository.as_ref(),
                    &self.app_data_dir,
                    &instance.id,
                );
                anyhow::bail!("Instalação cancelada");
            }
            let version = versions_by_hash.get(&file.hashes.sha1);
            let icon_url =
                version.and_then(|v| icons_by_project.get(&v.project_id).cloned().flatten());
            let name = version
                .and_then(|v| titles_by_project.get(&v.project_id))
                .cloned()
                .or_else(|| version.map(|v| v.name.clone()))
                .unwrap_or_else(|| {
                    file.path
                        .rsplit('/')
                        .next()
                        .unwrap_or(&file.path)
                        .to_string()
                });
            on_event(AstroPackEventDTO::Progress {
                kind: "mod".to_string(),
                name,
                icon_url: icon_url.clone(),
                current: i as u64,
                total,
            });

            let Some(url) = file.downloads.first() else {
                continue;
            };
            // `file.path` comes from the untrusted `.mrpack` index — reject
            // any `..`/absolute path that would escape the instance dir.
            let Some(dest) = safe_join(&instance_dir, &file.path) else {
                continue;
            };
            file_downloader::download_to_file(
                &self.http_client,
                url,
                &dest,
                Some(&file.hashes.sha1),
            )
            .await?;

            if let (Some(kind), Some(version)) = (kind_for_mrpack_path(&file.path), version) {
                let mod_name = titles_by_project
                    .get(&version.project_id)
                    .cloned()
                    .unwrap_or_else(|| version.name.clone());
                let installed = InstalledMod::new(
                    instance.id.clone(),
                    version.project_id.clone(),
                    "modrinth".to_string(),
                    mod_name,
                    version.version_number.clone(),
                    dest.display().to_string(),
                    icon_url,
                    kind.to_string(),
                );
                let _ = self.mod_repository.save(&installed);
            }
        }

        mrpack::extract_overrides(&bytes, &instance_dir)?;
        on_event(AstroPackEventDTO::Done {
            instance_id: instance.id.clone(),
        });

        Ok(instance_mapper::to_dto(&instance))
    }
}

fn loader_id_for(dependency_key: &str) -> String {
    dependency_key.trim_end_matches("-loader").to_string()
}
