use tauri::State;

use crate::application::dto::{SaveServerInput, ServerEntryDTO};
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_instance_servers(
    state: State<AppState>,
    id: String,
) -> Result<Vec<ServerEntryDTO>, String> {
    state
        .instance_workspace
        .list_servers(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_instance_server(
    state: State<AppState>,
    id: String,
    input: SaveServerInput,
) -> Result<(), String> {
    state
        .instance_workspace
        .add_server(&id, &input.name, &input.ip)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_instance_server(
    state: State<AppState>,
    id: String,
    index: usize,
    input: SaveServerInput,
) -> Result<(), String> {
    state
        .instance_workspace
        .update_server(&id, index, &input.name, &input.ip)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance_server(
    state: State<AppState>,
    id: String,
    index: usize,
) -> Result<(), String> {
    state
        .instance_workspace
        .delete_server(&id, index)
        .map_err(|e| e.to_string())
}
