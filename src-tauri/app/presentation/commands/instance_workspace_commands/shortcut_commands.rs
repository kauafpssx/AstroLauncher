use tauri::State;

use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_instance_shortcuts(state: State<AppState>) -> Result<Vec<String>, String> {
    state
        .instance_workspace
        .list_shortcut_ids()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_instance_shortcut(
    state: State<AppState>,
    id: String,
    icon_png_base64: Option<String>,
) -> Result<bool, String> {
    state
        .instance_workspace
        .toggle_shortcut(&id, icon_png_base64.as_deref())
        .map_err(|e| e.to_string())
}

/// Re-creates the instance's shortcut with its current icon (no-op if none
/// exists): called after the icon changes so an existing shortcut updates
/// without the user having to toggle it off/on.
#[tauri::command]
pub fn refresh_instance_shortcut_icon(
    state: State<AppState>,
    id: String,
    icon_png_base64: Option<String>,
) -> Result<(), String> {
    state
        .instance_workspace
        .refresh_shortcut_icon(&id, icon_png_base64.as_deref())
        .map_err(|e| e.to_string())
}
