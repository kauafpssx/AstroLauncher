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

/// Async + `spawn_blocking`, unlike its sibling commands here: decoding,
/// resizing and re-encoding a screenshot is real CPU work, and a plain sync
/// `#[tauri::command]` runs directly on the IPC dispatch thread (see
/// `tauri-macros`' `body_blocking`, which just calls the function inline —
/// no offloading happens automatically). Ten of those back to back froze
/// the whole UI for the duration; this moves the work to Tokio's blocking
/// pool instead.
#[tauri::command]
pub async fn read_instance_screenshot_thumbnail(
    state: State<'_, AppState>,
    id: String,
    name: String,
) -> Result<String, String> {
    let workspace = state.instance_workspace.clone();
    tokio::task::spawn_blocking(move || workspace.read_screenshot_thumbnail_data_uri(&id, &name))
        .await
        .map_err(|e| e.to_string())?
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
