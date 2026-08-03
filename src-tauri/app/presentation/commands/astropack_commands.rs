use std::sync::Arc;

use tauri::{AppHandle, Emitter, State};

use crate::application::dto::{AstroPackManifest, ExportResultDTO, ExportSelection, ExportSummaryDTO, ImportAstroPackInput, InstanceDTO};
use crate::presentation::state::AppState;

#[tauri::command]
pub async fn preview_astropack(state: State<'_, AppState>, file_path: String) -> Result<AstroPackManifest, String> {
    state.astropack.preview(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_astropack_export_summary(state: State<'_, AppState>, instance_id: String) -> Result<ExportSummaryDTO, String> {
    state.astropack.get_export_summary(&instance_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_instance(
    state: State<'_, AppState>,
    instance_id: String,
    dest_path: String,
    selection: ExportSelection,
    icon_data_uri: Option<String>,
) -> Result<ExportResultDTO, String> {
    state.astropack.export_instance(&instance_id, &dest_path, selection, icon_data_uri).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn import_astropack(
    app: AppHandle,
    state: State<'_, AppState>,
    input: ImportAstroPackInput,
) -> Result<InstanceDTO, String> {
    let app_clone = app.clone();
    state
        .astropack
        .import_astropack(
            &input.file_path,
            input.selection,
            Arc::new(move |event| {
                let _ = app_clone.emit("astropack://event", event);
            }),
        )
        .await
        .map_err(|e| e.to_string())
}
