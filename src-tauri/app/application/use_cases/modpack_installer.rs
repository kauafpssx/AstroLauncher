use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crate::application::dto::{AstroPackEventDTO, InstallModpackInput, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::domain::entities::{InstalledMod, Instance};
use crate::domain::repositories::{InstanceRepository, ModRepository};
use crate::infrastructure::curseforge;
use crate::infrastructure::discord::DiscordRpcHandle;
use crate::infrastructure::downloader::file_downloader;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::modrinth::{self, mrpack};
use crate::infrastructure::persistence::config::json_settings_repository;

pub struct ModpackInstallerService {
    instance_repository: Arc<dyn InstanceRepository>,
    mod_repository: Arc<dyn ModRepository>,
    discord: DiscordRpcHandle,
    http_client: reqwest::Client,
    app_data_dir: PathBuf,
    /// Only one modpack install runs from the UI at a time, so a single
    /// shared flag is enough to signal cancellation into whichever download
    /// loop is currently running.
    cancelled: Arc<AtomicBool>,
}

/// Cleans up a partially-downloaded instance after a cancelled install —
/// otherwise the user would be left with a broken, incomplete instance
/// silently sitting in their list.
fn rollback_instance(
    instance_repository: &dyn InstanceRepository,
    app_data_dir: &std::path::Path,
    instance_id: &str,
) {
    let _ = instance_repository.delete(instance_id);
    let instance_dir = paths::instance_dir(app_data_dir, instance_id);
    if instance_dir.exists() {
        let _ = std::fs::remove_dir_all(&instance_dir);
    }
}

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
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        mod_repository: Arc<dyn ModRepository>,
        discord: DiscordRpcHandle,
        http_client: reqwest::Client,
        app_data_dir: PathBuf,
    ) -> Self {
        Self {
            instance_repository,
            mod_repository,
            discord,
            http_client,
            app_data_dir,
            cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Signals the currently-running install (if any) to stop before its
    /// next file download.
    pub fn cancel(&self) {
        self.cancelled.store(true, Ordering::SeqCst);
    }

    /// Downloads a modpack's icon and saves it alongside manually-uploaded
    /// custom icons, so it shows up like any other icon the user picked.
    async fn download_icon(&self, icon_url: &Option<String>) -> Option<String> {
        let url = icon_url.as_ref()?;
        let bytes = self
            .http_client
            .get(url)
            .send()
            .await
            .ok()?
            .error_for_status()
            .ok()?
            .bytes()
            .await
            .ok()?;

        let dir = paths::custom_icons_dir(&self.app_data_dir);
        std::fs::create_dir_all(&dir).ok()?;
        let path = dir.join(format!("{}.png", uuid::Uuid::new_v4()));

        // Modrinth/CurseForge often serve project icons as WebP regardless
        // of the `.png` we save under — decode-and-re-encode so the file on
        // disk is a *real* PNG like every other icon in the app (manual
        // uploads go through the same crop-to-PNG step on the frontend),
        // square-cropped the same way. Falls back to the raw bytes if
        // decoding fails so a weird icon never blocks the whole install.
        let encoded = Self::normalize_icon_png(&bytes);
        std::fs::write(&path, encoded.as_deref().unwrap_or(&bytes)).ok()?;
        Some(path.to_string_lossy().to_string())
    }

    fn normalize_icon_png(bytes: &[u8]) -> Option<Vec<u8>> {
        use image::GenericImageView;

        let img = image::load_from_memory(bytes).ok()?;
        let (width, height) = img.dimensions();
        let side = width.min(height);
        let square = img.crop_imm((width - side) / 2, (height - side) / 2, side, side);
        let resized = square.resize_exact(128, 128, image::imageops::FilterType::Lanczos3);

        let mut out = std::io::Cursor::new(Vec::new());
        resized.write_to(&mut out, image::ImageFormat::Png).ok()?;
        Some(out.into_inner())
    }

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
            let dest = instance_dir.join(&file.path);
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

    /// Downloads a CurseForge modpack zip, derives the Minecraft
    /// version/loader from its `manifest.json`, creates a new instance,
    /// resolves and downloads every referenced mod file, and extracts the
    /// `overrides` folder into it.
    pub async fn install_curseforge_modpack(
        &self,
        input: InstallModpackInput,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<InstanceDTO> {
        self.cancelled.store(false, Ordering::SeqCst);
        let _presence = self
            .discord
            .guard("Instalando modpack", input.instance_name.clone());

        let api_key = json_settings_repository::resolve_curseforge_api_key(&self.app_data_dir)
            .ok_or_else(|| {
                anyhow::anyhow!(
                    "Configure sua API key do CurseForge em Configurações antes de instalar."
                )
            })?;

        let bytes = self
            .http_client
            .get(&input.download_url)
            .send()
            .await?
            .error_for_status()?
            .bytes()
            .await?
            .to_vec();

        let manifest = curseforge::modpack::read_manifest(&bytes)?;

        let mc_version = manifest.minecraft.version.clone();
        let (loader, loader_version) = manifest
            .minecraft
            .mod_loaders
            .iter()
            .find(|l| l.primary)
            .or_else(|| manifest.minecraft.mod_loaders.first())
            .and_then(|l| curseforge::modpack::parse_loader_id(&l.id))
            .map(|(id, v)| (Some(id), Some(v)))
            .unwrap_or((None, None));

        let mut instance = Instance::new(input.instance_name, mc_version);
        instance.loader = loader;
        instance.loader_version = loader_version;
        instance.folder_id = input.folder_id;
        instance.icon_path = self.download_icon(&input.icon_url).await;
        self.instance_repository.save(&instance)?;

        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        let mods_dir = instance_dir.join("mods");
        std::fs::create_dir_all(&mods_dir)?;

        let project_ids: Vec<u32> = {
            let mut ids: Vec<u32> = manifest.files.iter().map(|f| f.project_id).collect();
            ids.sort_unstable();
            ids.dedup();
            ids
        };
        let mut icons_by_project: std::collections::HashMap<u32, Option<String>> =
            std::collections::HashMap::new();
        let mut names_by_project: std::collections::HashMap<u32, String> =
            std::collections::HashMap::new();
        for entry in curseforge::client::get_mods_by_ids(&self.http_client, &api_key, &project_ids)
            .await
            .unwrap_or_default()
        {
            icons_by_project.insert(entry.id, entry.logo.map(|l| l.url));
            names_by_project.insert(entry.id, entry.name);
        }

        let total = manifest.files.len() as u64;
        for (i, file) in manifest.files.iter().enumerate() {
            if self.cancelled.load(Ordering::SeqCst) {
                rollback_instance(
                    self.instance_repository.as_ref(),
                    &self.app_data_dir,
                    &instance.id,
                );
                anyhow::bail!("Instalação cancelada");
            }
            let resolved = curseforge::client::get_file(
                &self.http_client,
                &api_key,
                file.project_id,
                file.file_id,
            )
            .await?;
            let icon_url = icons_by_project.get(&file.project_id).cloned().flatten();
            let mod_name = names_by_project
                .get(&file.project_id)
                .cloned()
                .unwrap_or_else(|| resolved.display_name.clone());
            on_event(AstroPackEventDTO::Progress {
                kind: "mod".to_string(),
                name: mod_name.clone(),
                icon_url: icon_url.clone(),
                current: i as u64,
                total,
            });
            let Some(url) = resolved.download_url else {
                continue;
            };
            let dest = mods_dir.join(&resolved.file_name);
            file_downloader::download_to_file(&self.http_client, &url, &dest, None).await?;

            let installed = InstalledMod::new(
                instance.id.clone(),
                file.project_id.to_string(),
                "curseforge".to_string(),
                mod_name,
                resolved.display_name.clone(),
                dest.display().to_string(),
                icon_url,
                "mod".to_string(),
            );
            let _ = self.mod_repository.save(&installed);
        }

        curseforge::modpack::extract_overrides(&bytes, &manifest.overrides, &instance_dir)?;
        on_event(AstroPackEventDTO::Done {
            instance_id: instance.id.clone(),
        });

        Ok(instance_mapper::to_dto(&instance))
    }
}

fn loader_id_for(dependency_key: &str) -> String {
    dependency_key.trim_end_matches("-loader").to_string()
}
