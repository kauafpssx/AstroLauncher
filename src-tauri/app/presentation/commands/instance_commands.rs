use tauri::State;

use crate::application::dto::{CreateInstanceInput, InstanceDTO, UpdateInstanceInput};
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_instances(state: State<AppState>) -> Result<Vec<InstanceDTO>, String> {
    state.list_instances.execute().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_instance(state: State<AppState>, input: CreateInstanceInput) -> Result<InstanceDTO, String> {
    state.create_instance.execute(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_instance(state: State<AppState>, input: UpdateInstanceInput) -> Result<InstanceDTO, String> {
    state.update_instance.execute(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance(state: State<AppState>, id: String) -> Result<(), String> {
    state.delete_instance.execute(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn move_instance_to_folder(
    state: State<AppState>,
    id: String,
    folder_id: Option<String>,
) -> Result<InstanceDTO, String> {
    state.move_instance_to_folder.execute(&id, folder_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_instances(state: State<AppState>, ordered_ids: Vec<String>) -> Result<(), String> {
    state.reorder_instances.execute(ordered_ids).map_err(|e| e.to_string())
}
