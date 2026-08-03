use tauri::State;

use crate::presentation::state::AppState;

/// Frontend calls this on every screen it wants reflected in Rich Presence
/// (main menu, create instance, edit instance, skins). Backend-driven flows
/// (modpack install, mod download, playing) set their own presence and
/// revert automatically — this command must not be called while one of
/// those is in progress, or it will get overwritten anyway once they finish.
#[tauri::command]
pub fn discord_set_presence(state: State<AppState>, details: String, activity_state: String) {
    state.discord.set_custom(details, activity_state);
}
