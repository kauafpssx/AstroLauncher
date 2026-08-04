use tauri::State;

use crate::application::dto::{SettingsDTO, UpdateSettingsInput};
use crate::presentation::state::AppState;

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> SettingsDTO {
    state.settings.get()
}

#[tauri::command]
pub fn update_settings(
    state: State<AppState>,
    input: UpdateSettingsInput,
) -> Result<SettingsDTO, String> {
    state.settings.update(input).map_err(|e| e.to_string())
}
