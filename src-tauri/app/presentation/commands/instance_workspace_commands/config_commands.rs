use tauri::State;

use crate::application::dto::ConfigFileDTO;
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_instance_config_files(
    state: State<AppState>,
    id: String,
) -> Result<Vec<ConfigFileDTO>, String> {
    state
        .instance_workspace
        .list_config_files(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_instance_config_file(
    state: State<AppState>,
    id: String,
    path: String,
) -> Result<String, String> {
    state
        .instance_workspace
        .read_config_file(&id, &path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_instance_config_file(
    state: State<AppState>,
    id: String,
    path: String,
    content: String,
) -> Result<(), String> {
    state
        .instance_workspace
        .write_config_file(&id, &path, &content)
        .map_err(|e| e.to_string())
}
