use tauri::State;

use crate::application::dto::PlaytimeSummaryDTO;
use crate::presentation::state::AppState;

#[tauri::command]
pub fn get_playtime_summary(state: State<AppState>, id: String) -> Result<PlaytimeSummaryDTO, String> {
    state.playtime.get_summary(&id).map_err(|e| e.to_string())
}
