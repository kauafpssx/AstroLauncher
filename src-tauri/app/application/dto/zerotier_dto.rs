use serde::Serialize;

use crate::infrastructure::zerotier::{central, cli, ZeroTierStatus};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeInfoDTO {
    pub address: String,
    pub online: bool,
    pub version: String,
}

impl From<cli::NodeInfo> for NodeInfoDTO {
    fn from(value: cli::NodeInfo) -> Self {
        Self {
            address: value.address,
            online: value.online,
            version: value.version,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalNetworkDTO {
    pub id: String,
    pub name: String,
    pub status: cli::LocalNetworkStatus,
    pub assigned_addresses: Vec<String>,
    pub dhcp: bool,
}

impl From<cli::LocalNetworkInfo> for LocalNetworkDTO {
    fn from(value: cli::LocalNetworkInfo) -> Self {
        Self {
            id: value.id,
            name: value.name,
            status: value.status,
            assigned_addresses: value.assigned_addresses,
            dhcp: value.dhcp,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ZeroTierStatusDTO {
    pub installed: bool,
    pub node: Option<NodeInfoDTO>,
    pub networks: Vec<LocalNetworkDTO>,
}

impl From<ZeroTierStatus> for ZeroTierStatusDTO {
    fn from(value: ZeroTierStatus) -> Self {
        Self {
            installed: value.installed,
            node: value.node.map(Into::into),
            networks: value.networks.into_iter().map(Into::into).collect(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CentralNetworkSummaryDTO {
    pub id: String,
    pub name: String,
}

impl From<central::CentralNetworkSummary> for CentralNetworkSummaryDTO {
    fn from(value: central::CentralNetworkSummary) -> Self {
        Self {
            id: value.id,
            name: value.config.name,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CentralMemberDTO {
    pub node_id: String,
    pub name: Option<String>,
    pub authorized: bool,
    pub ip_assignments: Vec<String>,
}

impl From<central::CentralMember> for CentralMemberDTO {
    fn from(value: central::CentralMember) -> Self {
        Self {
            node_id: value.node_id,
            name: value.name,
            authorized: value.config.authorized,
            ip_assignments: value.config.ip_assignments,
        }
    }
}
