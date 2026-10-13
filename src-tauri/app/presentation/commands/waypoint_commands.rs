use tauri::State;

use crate::application::dto::{CreateWaypointInput, UpdateWaypointInput, WaypointDTO};
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_waypoints(
    state: State<AppState>,
    instance_id: String,
) -> Result<Vec<WaypointDTO>, String> {
    state
        .list_waypoints
        .execute(&instance_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_waypoint(
    state: State<AppState>,
    input: CreateWaypointInput,
) -> Result<WaypointDTO, String> {
    state
        .create_waypoint
        .execute(input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_waypoint(
    state: State<AppState>,
    id: String,
    input: UpdateWaypointInput,
) -> Result<WaypointDTO, String> {
    state
        .update_waypoint
        .execute(&id, input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_waypoint(state: State<AppState>, id: String) -> Result<(), String> {
    state
        .delete_waypoint
        .execute(&id)
        .map_err(|e| e.to_string())
}
