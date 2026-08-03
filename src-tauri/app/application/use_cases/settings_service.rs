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
        SettingsDTO {
            curseforge_api_key: settings.curseforge_api_key,
            root_group_name: settings.root_group_name,
            root_group_icon: settings.root_group_icon,
        }
    }

    pub fn update(&self, input: UpdateSettingsInput) -> anyhow::Result<SettingsDTO> {
        let current = json_settings_repository::read(&self.app_data_dir);
        let settings = LauncherSettings {
            curseforge_api_key: input.curseforge_api_key,
            root_group_name: input.root_group_name.or(current.root_group_name),
            root_group_icon: input.root_group_icon.or(current.root_group_icon),
        };
        json_settings_repository::write(&self.app_data_dir, &settings)?;
        Ok(SettingsDTO {
            curseforge_api_key: settings.curseforge_api_key,
            root_group_name: settings.root_group_name,
            root_group_icon: settings.root_group_icon,
        })
    }
}
