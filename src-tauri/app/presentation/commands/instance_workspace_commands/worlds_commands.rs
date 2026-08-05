use tauri::State;

use crate::application::dto::WorldDTO;
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_instance_worlds(state: State<AppState>, id: String) -> Result<Vec<WorldDTO>, String> {
    state
        .instance_workspace
        .list_worlds(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance_world(
    state: State<AppState>,
    id: String,
    world_name: String,
) -> Result<(), String> {
    state
        .instance_workspace
        .delete_world(&id, &world_name)
        .map_err(|e| e.to_string())
}
