use tauri::State;

use crate::application::dto::{SaveServerInput, ScreenshotDTO, ServerEntryDTO, WorldDTO};
use crate::presentation::state::AppState;

#[tauri::command]
pub fn read_instance_log(state: State<AppState>, id: String) -> Result<String, String> {
    state.instance_workspace.read_log(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_instance_notes(state: State<AppState>, id: String) -> Result<String, String> {
    state.instance_workspace.read_notes(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_instance_notes(state: State<AppState>, id: String, content: String) -> Result<(), String> {
    state.instance_workspace.write_notes(&id, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_instance_folder(state: State<AppState>, id: String) -> Result<(), String> {
    state.instance_workspace.open_folder(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_instance_worlds(state: State<AppState>, id: String) -> Result<Vec<WorldDTO>, String> {
    state.instance_workspace.list_worlds(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance_world(state: State<AppState>, id: String, world_name: String) -> Result<(), String> {
    state.instance_workspace.delete_world(&id, &world_name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_instance_servers(state: State<AppState>, id: String) -> Result<Vec<ServerEntryDTO>, String> {
    state.instance_workspace.list_servers(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_instance_server(state: State<AppState>, id: String, input: SaveServerInput) -> Result<(), String> {
    state.instance_workspace.add_server(&id, &input.name, &input.ip).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_instance_server(state: State<AppState>, id: String, index: usize, input: SaveServerInput) -> Result<(), String> {
    state
        .instance_workspace
        .update_server(&id, index, &input.name, &input.ip)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance_server(state: State<AppState>, id: String, index: usize) -> Result<(), String> {
    state.instance_workspace.delete_server(&id, index).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_instance_screenshots(state: State<AppState>, id: String) -> Result<Vec<ScreenshotDTO>, String> {
    state.instance_workspace.list_screenshots(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_instance_screenshot(state: State<AppState>, id: String, name: String) -> Result<String, String> {
    state.instance_workspace.read_screenshot_data_uri(&id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance_screenshot(state: State<AppState>, id: String, name: String) -> Result<(), String> {
    state.instance_workspace.delete_screenshot(&id, &name).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_instance_screenshot_as(state: State<AppState>, id: String, name: String, dest_path: String) -> Result<(), String> {
    state
        .instance_workspace
        .save_screenshot_as(&id, &name, &dest_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_instance_screenshot(state: State<AppState>, id: String, name: String, new_name: String) -> Result<String, String> {
    state.instance_workspace.rename_screenshot(&id, &name, &new_name).map_err(|e| e.to_string())
}
