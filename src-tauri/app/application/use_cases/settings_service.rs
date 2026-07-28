use std::path::PathBuf;

use crate::application::dto::{SettingsDTO, UpdateSettingsInput};
use crate::infrastructure::persistence::config::json_settings_repository::{self, LauncherSettings};

pub struct SettingsService {
    app_data_dir: PathBuf,
}

impl SettingsService {
    pub fn new(app_data_dir: PathBuf) -> Self {
        Self { app_data_dir }
    }

    pub fn get(&self) -> SettingsDTO {
        let settings = json_settings_repository::read(&self.app_data_dir);
        SettingsDTO { curseforge_api_key: settings.curseforge_api_key }
    }

    pub fn update(&self, input: UpdateSettingsInput) -> anyhow::Result<SettingsDTO> {
        let settings = LauncherSettings { curseforge_api_key: input.curseforge_api_key };
        json_settings_repository::write(&self.app_data_dir, &settings)?;
        Ok(SettingsDTO { curseforge_api_key: settings.curseforge_api_key })
    }
}
