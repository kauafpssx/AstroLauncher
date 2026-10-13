use tauri::State;

use crate::presentation::state::AppState;

#[tauri::command]
pub fn discord_set_presence(state: State<AppState>, details: String, activity_state: String) {
    state.discord.set_custom(details, activity_state);
}
