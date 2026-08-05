use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::application::dto::InstanceDTO;
use crate::application::mappers::instance_mapper;
use crate::domain::entities::{InstalledMod, Instance};
use crate::domain::errors::InstanceError;
use crate::domain::repositories::{InstanceRepository, ModRepository};
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::process::manager::ProcessManager;

pub struct DuplicateInstanceUseCase {
    instance_repository: Arc<dyn InstanceRepository>,
    mod_repository: Arc<dyn ModRepository>,
    process_manager: Arc<ProcessManager>,
    app_data_dir: PathBuf,
}

impl DuplicateInstanceUseCase {
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        mod_repository: Arc<dyn ModRepository>,
        process_manager: Arc<ProcessManager>,
        app_data_dir: PathBuf,
    ) -> Self {
        Self {
            instance_repository,
            mod_repository,
            process_manager,
            app_data_dir,
        }
    }

    pub fn execute(&self, id: &str) -> Result<InstanceDTO, InstanceError> {
        if self.process_manager.is_running(id) {
            return Err(InstanceError::AlreadyRunning(id.to_string()));
        }

        let source = self.instance_repository.find_by_id(id)?;

        let mut copy = Instance::new(duplicate_name(&source.name), source.version.clone());
        copy.loader = source.loader.clone();
        copy.loader_version = source.loader_version.clone();
        copy.icon_path = source.icon_path.clone();
        copy.java_args = source.java_args.clone();
        copy.min_memory = source.min_memory;
        copy.max_memory = source.max_memory;
        copy.folder_id = source.folder_id.clone();
        // Same position so the copy sits right next to the original; the
        // next drag-reorder normalizes positions anyway.
        copy.position = source.position;

        let source_dir = paths::instance_dir(&self.app_data_dir, id);
        let copy_dir = paths::instance_dir(&self.app_data_dir, &copy.id);
        // Files first: a failed folder copy leaves only an orphan directory
        // (invisible), while a failed row save would leave a broken instance
        // that shows up on the next refresh with a partial folder.
        if source_dir.exists() {
            copy_dir_all(&source_dir, &copy_dir)
                .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }

        self.instance_repository.save(&copy)?;

        // Mod metadata rows reference absolute paths inside the source
        // instance dir — duplicate them with paths rewritten to the copy.
        // Rows whose file is not under the source dir are skipped: they were
        // not copied, and keeping them would cross-link the copy to the
        // source's files (toggling/deleting would hit the original).
        let mods = self.mod_repository.find_by_instance(id)?;
        for m in &mods {
            let Some(file_path) = rewrite_to_copy_dir(&source_dir, &copy_dir, &m.file_path) else {
                continue;
            };
            let installed = InstalledMod::new(
                copy.id.clone(),
                m.mod_id.clone(),
                m.source.clone(),
                m.name.clone(),
                m.version.clone(),
                file_path,
                m.icon_url.clone(),
                m.kind.clone(),
            );
            self.mod_repository.save(&installed)?;
        }

        Ok(instance_mapper::to_dto(&copy))
    }
}

fn duplicate_name(name: &str) -> String {
    format!("{name} (cópia)")
}

/// Recursive folder copy (walkdir avoids std's symlink-following surprises
/// and lets each entry map 1:1 from source to destination).
fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in walkdir::WalkDir::new(src).min_depth(1) {
        let entry = entry?;
        let relative = entry
            .path()
            .strip_prefix(src)
            .map_err(std::io::Error::other)?;
        let target = dst.join(relative);
        if entry.file_type().is_dir() {
            std::fs::create_dir_all(&target)?;
        } else {
            if let Some(parent) = target.parent() {
                std::fs::create_dir_all(parent)?;
            }
            std::fs::copy(entry.path(), &target)?;
        }
    }
    Ok(())
}

/// Re-points an absolute file path stored in the DB (e.g.
/// `.../instances/<old>/mods/x.jar`) at the copied instance's directory.
/// `None` when the path lives outside the source dir (see the caller).
fn rewrite_to_copy_dir(source_dir: &Path, copy_dir: &Path, file_path: &str) -> Option<String> {
    Path::new(file_path)
        .strip_prefix(source_dir)
        .ok()
        .map(|relative| copy_dir.join(relative).to_string_lossy().into_owned())
}
