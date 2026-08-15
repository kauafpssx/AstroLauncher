use std::path::PathBuf;

use crate::application::dto::{SettingsDTO, UpdateSettingsInput};
use crate::application::validation::{MAX_MCSTAT_API_KEY, MAX_ZEROTIER_API_TOKEN};
use crate::infrastructure::persistence::config::json_settings_repository::{
    self, LauncherSettings,
};

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
            mcstat_api_key: settings.mcstat_api_key,
            root_group_name: settings.root_group_name,
            root_group_icon: settings.root_group_icon,
            zerotier_api_token: settings.zerotier_api_token,
        }
    }

    pub fn update(&self, input: UpdateSettingsInput) -> anyhow::Result<SettingsDTO> {
        if let Some(key) = input.mcstat_api_key.as_deref() {
            if key.chars().count() > MAX_MCSTAT_API_KEY {
                anyhow::bail!("MCStat API key must be at most {MAX_MCSTAT_API_KEY} characters");
            }
        }
        if let Some(token) = input.zerotier_api_token.as_deref() {
            if token.chars().count() > MAX_ZEROTIER_API_TOKEN {
                anyhow::bail!(
                    "ZeroTier API token must be at most {MAX_ZEROTIER_API_TOKEN} characters"
                );
            }
        }
        let current = json_settings_repository::read(&self.app_data_dir);
        let settings = LauncherSettings {
            curseforge_api_key: input.curseforge_api_key,
            mcstat_api_key: input.mcstat_api_key,
            root_group_name: input.root_group_name.or(current.root_group_name),
            root_group_icon: input.root_group_icon.or(current.root_group_icon),
            zerotier_api_token: input.zerotier_api_token.or(current.zerotier_api_token),
        };
        json_settings_repository::write(&self.app_data_dir, &settings)?;
        Ok(SettingsDTO {
            curseforge_api_key: settings.curseforge_api_key,
            mcstat_api_key: settings.mcstat_api_key,
            root_group_name: settings.root_group_name,
            root_group_icon: settings.root_group_icon,
            zerotier_api_token: settings.zerotier_api_token,
        })
    }
}
