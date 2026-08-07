use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crate::domain::repositories::{InstanceRepository, ModRepository};
use crate::infrastructure::discord::DiscordRpcHandle;
use crate::infrastructure::filesystem::paths;

mod curseforge_install;
mod modrinth_install;

/// Modpack file downloads hit Modrinth/CurseForge's CDN in parallel instead
/// of one at a time. Deliberately more conservative than
/// `asset_downloader`'s 16 (Mojang's static asset CDN) — these are third-
/// party hosts fronting a heavier per-file payload (whole mod jars), so
/// staying polite matters more than squeezing out max throughput.
pub(super) const FILE_CONCURRENCY: usize = 6;

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

/// Cleans up a partially-downloaded instance after a cancelled install:
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
        // of the `.png` we save under: decode-and-re-encode so the file on
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
}
