use serde::{Deserialize, Serialize};

/// ZeroTier Central API base URL, sourced from `plugins.env` in
/// `tauri.conf.json` like every other external endpoint.
pub fn base_url() -> &'static str {
    crate::infrastructure::config::api()
        .zerotier_central
        .as_str()
}

#[derive(Debug, Clone, Deserialize)]
pub struct CentralNetworkSummary {
    pub id: String,
    #[serde(default)]
    pub config: CentralNetworkConfig,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct CentralNetworkConfig {
    #[serde(default)]
    pub name: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CentralMember {
    #[serde(rename = "nodeId")]
    pub node_id: String,
    #[serde(default)]
    pub name: Option<String>,
    pub config: CentralMemberConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CentralMemberConfig {
    pub authorized: bool,
    #[serde(rename = "ipAssignments", default)]
    pub ip_assignments: Vec<String>,
}

#[derive(Debug, Serialize)]
struct SetAuthorizedBody {
    config: SetAuthorizedConfig,
}

#[derive(Debug, Serialize)]
struct SetAuthorizedConfig {
    authorized: bool,
}

fn map_error(status: reqwest::StatusCode) -> anyhow::Error {
    if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
        anyhow::anyhow!("Token da API ZeroTier Central inválido ou expirado")
    } else {
        anyhow::anyhow!("ZeroTier Central respondeu com erro: {status}")
    }
}

pub async fn list_owned_networks(
    client: &reqwest::Client,
    base_url: &str,
    token: &str,
) -> anyhow::Result<Vec<CentralNetworkSummary>> {
    let url = format!("{base_url}/network");
    let response = client
        .get(url)
        .header("Authorization", format!("token {token}"))
        .send()
        .await?;
    if let Err(_e) = response.error_for_status_ref() {
        return Err(map_error(response.status()));
    }
    Ok(response.json().await?)
}

pub async fn list_members(
    client: &reqwest::Client,
    base_url: &str,
    token: &str,
    network_id: &str,
) -> anyhow::Result<Vec<CentralMember>> {
    let url = format!("{base_url}/network/{network_id}/member");
    let response = client
        .get(url)
        .header("Authorization", format!("token {token}"))
        .send()
        .await?;
    if let Err(_e) = response.error_for_status_ref() {
        return Err(map_error(response.status()));
    }
    Ok(response.json().await?)
}

pub async fn set_member_authorized(
    client: &reqwest::Client,
    base_url: &str,
    token: &str,
    network_id: &str,
    node_id: &str,
    authorized: bool,
) -> anyhow::Result<()> {
    let url = format!("{base_url}/network/{network_id}/member/{node_id}");
    let body = SetAuthorizedBody {
        config: SetAuthorizedConfig { authorized },
    };
    let response = client
        .post(url)
        .header("Authorization", format!("token {token}"))
        .json(&body)
        .send()
        .await?;
    if let Err(_e) = response.error_for_status_ref() {
        return Err(map_error(response.status()));
    }
    Ok(())
}

#[cfg(test)]
#[path = "tests/central_tests.rs"]
mod tests;
