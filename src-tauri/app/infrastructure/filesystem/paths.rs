use std::path::{Path, PathBuf};

pub fn versions_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("versions")
}

pub fn libraries_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("libraries")
}

pub fn assets_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("assets")
}

pub fn custom_icons_dir(app_data_dir: &Path) -> PathBuf {
    assets_dir(app_data_dir).join("icons")
}

pub fn instances_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("instances")
}

pub fn instance_dir(app_data_dir: &Path, instance_id: &str) -> PathBuf {
    instances_dir(app_data_dir).join(instance_id)
}
