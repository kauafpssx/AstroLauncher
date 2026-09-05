use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WaypointDTO {
    pub id: String,
    pub instance_id: String,
    pub name: String,
    pub icon: String,
    pub dimension: String,
    pub x: i64,
    pub y: Option<i64>,
    pub z: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWaypointInput {
    pub instance_id: String,
    pub name: String,
    pub icon: String,
    pub dimension: String,
    pub x: i64,
    pub y: Option<i64>,
    pub z: i64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWaypointInput {
    pub name: String,
    pub icon: String,
    pub dimension: String,
    pub x: i64,
    pub y: Option<i64>,
    pub z: i64,
}
