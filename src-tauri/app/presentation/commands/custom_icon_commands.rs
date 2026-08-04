use tauri::State;

use crate::application::dto::CustomIconDTO;
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_custom_icons(state: State<AppState>) -> Result<Vec<CustomIconDTO>, String> {
    state.custom_icon.list().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_custom_icon(
    state: State<AppState>,
    base64_png: String,
) -> Result<CustomIconDTO, String> {
    state
        .custom_icon
        .save(&base64_png)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_custom_icon(state: State<AppState>, id: String) -> Result<(), String> {
    state.custom_icon.delete(&id).map_err(|e| e.to_string())
}
