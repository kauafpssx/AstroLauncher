use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum LaunchEventDTO {
    Stage {
        label: String,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        stage: String,
        current_item: String,
        stage_current: u64,
        stage_total: u64,
        overall_current: u64,
        overall_total: u64,
    },
    Error {
        message: String,
    },
}
