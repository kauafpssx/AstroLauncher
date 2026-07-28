use std::sync::Arc;

use tauri::{AppHandle, Emitter, State};

use crate::application::dto::VersionDTO;
use crate::presentation::state::AppState;

#[tauri::command]
pub async fn list_minecraft_versions(state: State<'_, AppState>) -> Result<Vec<VersionDTO>, String> {
    state.fetch_version_manifest.execute().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn launch_instance(app: AppHandle, state: State<'_, AppState>, id: String) -> Result<(), String> {
    let app_for_event = app.clone();
    let app_for_exit = app.clone();

    state
        .launch_instance
        .execute(
            &id,
            Arc::new(move |event| {
                let _ = app_for_event.emit("launch://event", event);
            }),
            Arc::new(move |instance_id: &str| {
                let _ = app_for_exit.emit("instance://stopped", instance_id);
            }),
        )
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn stop_instance(state: State<AppState>, id: String) -> Result<(), String> {
    state.stop_instance.execute(&id).map_err(|e| e.to_string())
}
