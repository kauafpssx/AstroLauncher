use tauri::State;

use crate::presentation::state::AppState;

mod config_commands;
mod notes_commands;
mod screenshots_commands;
mod servers_commands;
mod shortcut_commands;
mod worlds_commands;

// Re-exported so every command (plus the hidden items `#[tauri::command]`
// generates) resolves at this module path, keeping the `generate_handler!`
// registrations in `lib.rs` unchanged.
pub use config_commands::*;
pub use notes_commands::*;
pub use screenshots_commands::*;
pub use servers_commands::*;
pub use shortcut_commands::*;
pub use worlds_commands::*;

#[tauri::command]
pub fn read_instance_log(state: State<AppState>, id: String) -> Result<String, String> {
    state
        .instance_workspace
        .read_log(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_instance_folder(state: State<AppState>, id: String) -> Result<(), String> {
    state
        .instance_workspace
        .open_folder(&id)
        .map_err(|e| e.to_string())
}
