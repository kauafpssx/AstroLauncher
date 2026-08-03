use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsDTO {
    pub curseforge_api_key: Option<String>,
    pub root_group_name: Option<String>,
    pub root_group_icon: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettingsInput {
    pub curseforge_api_key: Option<String>,
    #[serde(default)]
    pub root_group_name: Option<String>,
    #[serde(default)]
    pub root_group_icon: Option<String>,
}
