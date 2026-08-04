use tauri::State;

use crate::application::dto::{CreateFolderInput, FolderDTO, UpdateFolderInput};
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_folders(state: State<AppState>) -> Result<Vec<FolderDTO>, String> {
    state.list_folders.execute().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_folder(
    state: State<AppState>,
    input: CreateFolderInput,
) -> Result<FolderDTO, String> {
    state
        .create_folder
        .execute(input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_folder(
    state: State<AppState>,
    input: UpdateFolderInput,
) -> Result<FolderDTO, String> {
    state
        .update_folder
        .execute(input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_folder(state: State<AppState>, id: String) -> Result<(), String> {
    state.delete_folder.execute(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_folders(state: State<AppState>, ordered_ids: Vec<String>) -> Result<(), String> {
    state
        .reorder_folders
        .execute(ordered_ids)
        .map_err(|e| e.to_string())
}
