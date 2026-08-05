use tauri::State;

use crate::application::dto::ScreenshotDTO;
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_instance_screenshots(
    state: State<AppState>,
    id: String,
) -> Result<Vec<ScreenshotDTO>, String> {
    state
        .instance_workspace
        .list_screenshots(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_instance_screenshot(
    state: State<AppState>,
    id: String,
    name: String,
) -> Result<String, String> {
    state
        .instance_workspace
        .read_screenshot_data_uri(&id, &name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance_screenshot(
    state: State<AppState>,
    id: String,
    name: String,
) -> Result<(), String> {
    state
        .instance_workspace
        .delete_screenshot(&id, &name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_instance_screenshot_as(
    state: State<AppState>,
    id: String,
    name: String,
    dest_path: String,
) -> Result<(), String> {
    state
        .instance_workspace
        .save_screenshot_as(&id, &name, &dest_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_instance_screenshot(
    state: State<AppState>,
    id: String,
    name: String,
    new_name: String,
) -> Result<String, String> {
    state
        .instance_workspace
        .rename_screenshot(&id, &name, &new_name)
        .map_err(|e| e.to_string())
}
