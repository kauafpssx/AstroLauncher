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

#[tauri::command]
pub fn cancel_launch(state: State<AppState>) {
    state.launch_instance.cancel();
}

#[tauri::command]
pub fn get_total_system_memory_mb() -> u64 {
    let mut system = sysinfo::System::new();
    system.refresh_memory();
    system.total_memory() / (1024 * 1024)
}

/// Output device names as the OS reports them — Minecraft's `soundDevice`
/// option stores the device name verbatim (empty string means "system default").
#[tauri::command]
pub fn list_audio_output_devices() -> Vec<String> {
    use cpal::traits::{DeviceTrait, HostTrait};

    let host = cpal::default_host();
    host.output_devices()
        .map(|devices| devices.filter_map(|d| d.description().ok().map(|desc| desc.name().to_string())).collect())
        .unwrap_or_default()
}
