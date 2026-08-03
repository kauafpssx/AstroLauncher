use tauri::State;

use crate::application::dto::{SearchSkinsInput, SkinDetailDTO, SkinSummaryDTO};
use crate::presentation::state::AppState;

#[tauri::command]
pub async fn search_skins(state: State<'_, AppState>, input: SearchSkinsInput) -> Result<Vec<SkinSummaryDTO>, String> {
    state.skin_browser.search(input).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_skin(state: State<'_, AppState>, hash: String) -> Result<SkinDetailDTO, String> {
    state.skin_browser.get_skin(hash).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn download_skin(state: State<'_, AppState>, skin_url: String, dest_path: String) -> Result<(), String> {
    state.skin_browser.download_skin(skin_url, dest_path).await.map_err(|e| e.to_string())
}
