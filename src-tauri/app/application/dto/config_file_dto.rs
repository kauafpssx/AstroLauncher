use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigFileDTO {
    /// Path relative to the instance directory, forward-slash separated
    /// (e.g. `options.txt`, `config/sodium-options.json`).
    pub path: String,
    pub size_bytes: u64,
}
