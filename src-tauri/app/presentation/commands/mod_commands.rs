use std::sync::Arc;

use tauri::{AppHandle, Emitter, State};

use crate::application::dto::{
    GetModProjectInput, GetModVersionsInput, InstallCustomModInput, InstallModInput,
    InstallModpackInput, InstalledModDTO, InstanceDTO, ModProjectDTO, ModSearchResultDTO,
    ModVersionDTO, SearchModsInput, SuggestedMemoryDTO,
};
use crate::presentation::state::AppState;

#[tauri::command]
pub async fn search_mods(
    state: State<'_, AppState>,
    input: SearchModsInput,
) -> Result<Vec<ModSearchResultDTO>, String> {
    state
        .mod_browser
        .search(input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_mod_versions(
    state: State<'_, AppState>,
    input: GetModVersionsInput,
) -> Result<Vec<ModVersionDTO>, String> {
    state
        .mod_browser
        .get_versions(input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_mod_project(
    state: State<'_, AppState>,
    input: GetModProjectInput,
) -> Result<ModProjectDTO, String> {
    state
        .mod_browser
        .get_project(input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn install_mod(
    state: State<'_, AppState>,
    input: InstallModInput,
) -> Result<InstalledModDTO, String> {
    state
        .mod_manager
        .install(input)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn install_custom_mod(
    state: State<AppState>,
    input: InstallCustomModInput,
) -> Result<InstalledModDTO, String> {
    state
        .mod_manager
        .install_custom(input)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_instance_mods(
    state: State<AppState>,
    instance_id: String,
    kind: String,
) -> Result<Vec<InstalledModDTO>, String> {
    state
        .mod_manager
        .list(&instance_id, &kind)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_suggested_memory(
    state: State<AppState>,
    instance_id: String,
) -> Result<SuggestedMemoryDTO, String> {
    state
        .suggest_memory
        .execute(&instance_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_instance_mod_enabled(
    state: State<AppState>,
    instance_id: String,
    id: String,
    enabled: bool,
) -> Result<(), String> {
    state
        .mod_manager
        .set_enabled(&instance_id, &id, enabled)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_instance_mod(
    state: State<AppState>,
    instance_id: String,
    id: String,
) -> Result<(), String> {
    state
        .mod_manager
        .delete(&instance_id, &id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn install_modrinth_modpack(
    app: AppHandle,
    state: State<'_, AppState>,
    input: InstallModpackInput,
) -> Result<InstanceDTO, String> {
    let app_clone = app.clone();
    state
        .modpack_installer
        .install_modrinth_modpack(
            input,
            Arc::new(move |event| {
                let _ = app_clone.emit("modpack://event", event);
            }),
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn install_curseforge_modpack(
    app: AppHandle,
    state: State<'_, AppState>,
    input: InstallModpackInput,
) -> Result<InstanceDTO, String> {
    let app_clone = app.clone();
    state
        .modpack_installer
        .install_curseforge_modpack(
            input,
            Arc::new(move |event| {
                let _ = app_clone.emit("modpack://event", event);
            }),
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cancel_modpack_install(state: State<AppState>) {
    state.modpack_installer.cancel();
}
