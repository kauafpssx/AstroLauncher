use tauri::State;

use crate::application::dto::{AccountDTO, CreateAccountInput, UpdateAccountInput};
use crate::presentation::state::AppState;

#[tauri::command]
pub fn list_accounts(state: State<AppState>) -> Result<Vec<AccountDTO>, String> {
    state.list_accounts.execute().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_account(state: State<AppState>, input: CreateAccountInput) -> Result<AccountDTO, String> {
    state.create_account.execute(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_account(state: State<AppState>, input: UpdateAccountInput) -> Result<AccountDTO, String> {
    state.update_account.execute(input).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_account(state: State<AppState>, id: String) -> Result<(), String> {
    state.delete_account.execute(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_default_account(state: State<AppState>, id: String) -> Result<(), String> {
    state.set_default_account.execute(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_accounts(state: State<AppState>, ordered_ids: Vec<String>) -> Result<(), String> {
    state.reorder_accounts.execute(ordered_ids).map_err(|e| e.to_string())
}
