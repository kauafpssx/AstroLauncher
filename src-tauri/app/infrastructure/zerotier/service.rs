use std::path::PathBuf;

use super::{central, cli, installer};
use crate::infrastructure::persistence::config::json_settings_repository;

pub struct ZeroTierStatus {
    pub installed: bool,
    pub node: Option<cli::NodeInfo>,
    pub networks: Vec<cli::LocalNetworkInfo>,
}

pub struct ZeroTierService {
    http: reqwest::Client,
    app_data_dir: PathBuf,
}

impl ZeroTierService {
    pub fn new(http: reqwest::Client, app_data_dir: PathBuf) -> Self {
        Self { http, app_data_dir }
    }

    fn api_token(&self) -> anyhow::Result<String> {
        json_settings_repository::resolve_zerotier_api_token(&self.app_data_dir).ok_or_else(|| {
            anyhow::anyhow!(
                "Token da API ZeroTier Central não configurado. Adicione um em Configurações."
            )
        })
    }

    /// Tolerant of the CLI being unreachable: callers use `installed` to
    /// decide whether to show a "not installed" state instead of an error.
    pub fn status(&self) -> ZeroTierStatus {
        if !cli::is_installed() {
            return ZeroTierStatus {
                installed: false,
                node: None,
                networks: Vec::new(),
            };
        }
        ZeroTierStatus {
            installed: true,
            node: cli::node_info().ok(),
            networks: cli::list_networks().unwrap_or_default(),
        }
    }

    /// Downloads and runs the official ZeroTier One installer (elevated,
    /// `/quiet`). Windows-only: no driverless portable build exists.
    pub async fn install(&self) -> anyhow::Result<()> {
        installer::download_and_install(&self.http, &self.app_data_dir).await
    }

    pub fn join(&self, network_id: &str) -> anyhow::Result<()> {
        cli::join(network_id)
    }

    pub fn leave(&self, network_id: &str) -> anyhow::Result<()> {
        cli::leave(network_id)
    }

    pub fn list_networks(&self) -> anyhow::Result<Vec<cli::LocalNetworkInfo>> {
        cli::list_networks()
    }

    pub async fn list_owned_networks(&self) -> anyhow::Result<Vec<central::CentralNetworkSummary>> {
        let token = self.api_token()?;
        central::list_owned_networks(&self.http, central::base_url(), &token).await
    }

    pub async fn list_pending_members(
        &self,
        network_id: &str,
    ) -> anyhow::Result<Vec<central::CentralMember>> {
        let token = self.api_token()?;
        let members =
            central::list_members(&self.http, central::base_url(), &token, network_id).await?;
        Ok(members
            .into_iter()
            .filter(|m| !m.config.authorized)
            .collect())
    }

    pub async fn approve_member(&self, network_id: &str, node_id: &str) -> anyhow::Result<()> {
        let token = self.api_token()?;
        central::set_member_authorized(
            &self.http,
            central::base_url(),
            &token,
            network_id,
            node_id,
            true,
        )
        .await
    }

    pub async fn deauthorize_member(&self, network_id: &str, node_id: &str) -> anyhow::Result<()> {
        let token = self.api_token()?;
        central::set_member_authorized(
            &self.http,
            central::base_url(),
            &token,
            network_id,
            node_id,
            false,
        )
        .await
    }
}
