use tauri::State;

use crate::application::dto::NoteDTO;
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_instance_notes(state: State<AppState>, id: String) -> Result<Vec<NoteDTO>, String> {
    state
        .instance_workspace
        .list_notes(&id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_instance_note(
    state: State<AppState>,
    id: String,
    note_id: String,
) -> Result<String, String> {
    state
        .instance_workspace
        .read_note(&id, &note_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_instance_note(
    state: State<AppState>,
    id: String,
    note_id: String,
    content: String,
) -> Result<(), String> {
    state
        .instance_workspace
        .write_note(&id, &note_id, &content)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_instance_note(
    state: State<AppState>,
    id: String,
    title: String,
) -> Result<NoteDTO, String> {
    state
        .instance_workspace
        .create_note(&id, &title)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_instance_note(
    state: State<AppState>,
    id: String,
    note_id: String,
    new_title: String,
) -> Result<NoteDTO, String> {
    state
        .instance_workspace
        .rename_note(&id, &note_id, &new_title)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance_note(
    state: State<AppState>,
    id: String,
    note_id: String,
) -> Result<(), String> {
    state
        .instance_workspace
        .delete_note(&id, &note_id)
        .map_err(|e| e.to_string())
}
