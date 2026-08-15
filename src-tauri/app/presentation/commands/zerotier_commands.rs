use tauri::State;

use crate::application::dto::{
    CentralMemberDTO, CentralNetworkSummaryDTO, LocalNetworkDTO, ZeroTierStatusDTO,
};
use crate::presentation::state::AppState;

#[tauri::command]
pub fn zerotier_status(state: State<AppState>) -> ZeroTierStatusDTO {
    state.zerotier.status().into()
}

#[tauri::command]
pub async fn zerotier_install(state: State<'_, AppState>) -> Result<(), String> {
    state.zerotier.install().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn zerotier_join(state: State<AppState>, network_id: String) -> Result<(), String> {
    state.zerotier.join(&network_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn zerotier_leave(state: State<AppState>, network_id: String) -> Result<(), String> {
    state.zerotier.leave(&network_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn zerotier_list_networks(state: State<AppState>) -> Result<Vec<LocalNetworkDTO>, String> {
    state
        .zerotier
        .list_networks()
        .map(|networks| networks.into_iter().map(Into::into).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zerotier_list_owned_networks(
    state: State<'_, AppState>,
) -> Result<Vec<CentralNetworkSummaryDTO>, String> {
    state
        .zerotier
        .list_owned_networks()
        .await
        .map(|networks| networks.into_iter().map(Into::into).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zerotier_list_pending_members(
    state: State<'_, AppState>,
    network_id: String,
) -> Result<Vec<CentralMemberDTO>, String> {
    state
        .zerotier
        .list_pending_members(&network_id)
        .await
        .map(|members| members.into_iter().map(Into::into).collect())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zerotier_approve_member(
    state: State<'_, AppState>,
    network_id: String,
    node_id: String,
) -> Result<(), String> {
    state
        .zerotier
        .approve_member(&network_id, &node_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn zerotier_deauthorize_member(
    state: State<'_, AppState>,
    network_id: String,
    node_id: String,
) -> Result<(), String> {
    state
        .zerotier
        .deauthorize_member(&network_id, &node_id)
        .await
        .map_err(|e| e.to_string())
}
