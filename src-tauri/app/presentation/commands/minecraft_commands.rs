use std::path::{Path, PathBuf};
use std::sync::Arc;

use tauri::{AppHandle, Emitter, State};

use crate::application::dto::{JavaInfoDTO, VersionDTO};
use crate::infrastructure::filesystem::size::dir_size;
use crate::infrastructure::java::{detect, manager};
use crate::presentation::state::AppState;

#[tauri::command]
pub async fn list_minecraft_versions(
    state: State<'_, AppState>,
) -> Result<Vec<VersionDTO>, String> {
    state
        .fetch_version_manifest
        .execute()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn launch_instance(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
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

/// Returns and clears the instance id a desktop shortcut asked us to launch
/// via `--launch-instance <id>`. `None` when the app was opened normally.
#[tauri::command]
pub fn take_pending_launch() -> Option<String> {
    crate::infrastructure::cli::take_pending_launch()
}

#[tauri::command]
pub fn get_total_system_memory_mb() -> u64 {
    let mut system = sysinfo::System::new();
    system.refresh_memory();
    system.total_memory() / (1024 * 1024)
}

/// A binary's install directory, guessed as two levels up from the
/// executable (`<root>/bin/java.exe` is the standard JDK/JRE zip layout).
/// `None` for a bare `"java"` (resolved through `PATH` at spawn time, with
/// no filesystem location we can point at).
fn installation_dir_from_binary(bin: &Path) -> Option<PathBuf> {
    Some(bin.parent()?.parent()?.to_path_buf())
}

/// Reports the Java the launcher would actually use to launch: `path` when
/// given (an instance's custom Java override); otherwise, when
/// `instance_id` is given and that instance has already launched at least
/// once, the exact major `launch_instance` recorded for it (see
/// `last_java_major` on `Instance`) — the only way to know for sure, since
/// "system vs. one of possibly several portable JREs" can't be guessed
/// correctly from just `app_data_dir` (a system/bundled preference order
/// only approximates what a *specific* instance's Minecraft version
/// actually requires). Falls back to a best-effort preview (system Java,
/// else the newest portable JRE already downloaded) for an instance that
/// has never launched, or no instance context at all.
#[tauri::command]
pub fn get_java_info(
    state: State<AppState>,
    path: Option<String>,
    instance_id: Option<String>,
) -> JavaInfoDTO {
    if let Some(custom) = path.filter(|p| !p.is_empty()) {
        return JavaInfoDTO {
            major_version: detect::detect_major_version(&custom).ok(),
            install_size_bytes: installation_dir_from_binary(Path::new(&custom))
                .map(|dir| dir_size(&dir)),
        };
    }

    let last_major = instance_id.and_then(|id| {
        state
            .list_instances
            .execute()
            .ok()?
            .into_iter()
            .find(|i| i.id == id)?
            .last_java_major
    });

    if let Some(major) = last_major {
        let bundled_dir = state.app_data_dir.join("java").join(major.to_string());
        if bundled_dir.exists() {
            return JavaInfoDTO {
                major_version: Some(major as u32),
                install_size_bytes: Some(dir_size(&bundled_dir)),
            };
        }
        if let Ok(system_java) = detect::find_java() {
            if detect::detect_major_version(&system_java).ok() == Some(major as u32) {
                return JavaInfoDTO {
                    major_version: Some(major as u32),
                    install_size_bytes: installation_dir_from_binary(Path::new(&system_java))
                        .map(|dir| dir_size(&dir)),
                };
            }
        }
        // Recorded Java moved/was removed since the last launch — fall
        // through to the best-effort preview below instead of lying.
    }

    if let Ok(system_java) = detect::find_java() {
        if let Ok(major) = detect::detect_major_version(&system_java) {
            return JavaInfoDTO {
                major_version: Some(major),
                install_size_bytes: installation_dir_from_binary(Path::new(&system_java))
                    .map(|dir| dir_size(&dir)),
            };
        }
    }

    match manager::list_bundled_javas(&state.app_data_dir)
        .into_iter()
        .max()
    {
        Some(major) => JavaInfoDTO {
            major_version: Some(major),
            install_size_bytes: Some(dir_size(
                &state.app_data_dir.join("java").join(major.to_string()),
            )),
        },
        None => JavaInfoDTO {
            major_version: None,
            install_size_bytes: None,
        },
    }
}

/// Output device names as the OS reports them: Minecraft's `soundDevice`
/// option stores the device name verbatim (empty string means "system default").
#[tauri::command]
pub fn list_audio_output_devices() -> Vec<String> {
    use cpal::traits::{DeviceTrait, HostTrait};

    let host = cpal::default_host();
    host.output_devices()
        .map(|devices| {
            devices
                .filter_map(|d| d.description().ok().map(|desc| desc.name().to_string()))
                .collect()
        })
        .unwrap_or_default()
}
