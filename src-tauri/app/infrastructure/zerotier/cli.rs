use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use serde::{Deserialize, Serialize};

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn silent_command(bin: &str) -> Command {
    #[cfg_attr(not(target_os = "windows"), allow(unused_mut))]
    let mut cmd = Command::new(bin);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

/// `zerotier-cli` isn't on PATH in a stock Windows install: ZeroTier One
/// ships its CLI as a flag on the service executable itself, reading
/// `authtoken.secret` from the same directory.
#[cfg(target_os = "windows")]
fn candidates() -> Vec<Vec<String>> {
    vec![
        vec!["zerotier-cli".to_string()],
        vec![
            r"C:\ProgramData\ZeroTier\One\zerotier-one_x64.exe".to_string(),
            "-q".to_string(),
        ],
    ]
}

#[cfg(not(target_os = "windows"))]
fn candidates() -> Vec<Vec<String>> {
    vec![vec!["zerotier-cli".to_string()]]
}

fn run(args: &[&str]) -> anyhow::Result<String> {
    let mut last_err: Option<anyhow::Error> = None;
    for candidate in candidates() {
        let (bin, prefix_args) = candidate.split_first().expect("candidate is non-empty");
        let output = silent_command(bin).args(prefix_args).args(args).output();
        match output {
            Ok(output) if output.status.success() => {
                return Ok(String::from_utf8_lossy(&output.stdout).into_owned());
            }
            Ok(output) => {
                last_err = Some(anyhow::anyhow!(
                    "zerotier-cli {}: {}",
                    args.join(" "),
                    String::from_utf8_lossy(&output.stderr)
                ));
            }
            Err(e) => last_err = Some(e.into()),
        }
    }
    Err(last_err.unwrap_or_else(|| anyhow::anyhow!("zerotier-cli não encontrado")))
}

pub fn is_installed() -> bool {
    run(&["-j", "info"]).is_ok()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeInfo {
    pub address: String,
    pub online: bool,
    pub version: String,
}

pub fn node_info() -> anyhow::Result<NodeInfo> {
    let raw = run(&["-j", "info"])?;
    parse_info(&raw)
}

fn parse_info(raw: &str) -> anyhow::Result<NodeInfo> {
    Ok(serde_json::from_str(raw)?)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum LocalNetworkStatus {
    RequestingConfiguration,
    Ok,
    AccessDenied,
    NotFound,
    PortError,
    ClientTooOld,
    AuthenticationRequired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalNetworkInfo {
    pub id: String,
    pub name: String,
    pub status: LocalNetworkStatus,
    pub mac: String,
    #[serde(rename = "assignedAddresses")]
    pub assigned_addresses: Vec<String>,
    #[serde(rename = "type")]
    pub network_type: String,
    pub dhcp: bool,
}

pub fn list_networks() -> anyhow::Result<Vec<LocalNetworkInfo>> {
    let raw = run(&["-j", "listnetworks"])?;
    parse_listnetworks(&raw)
}

fn parse_listnetworks(raw: &str) -> anyhow::Result<Vec<LocalNetworkInfo>> {
    Ok(serde_json::from_str(raw)?)
}

pub fn join(network_id: &str) -> anyhow::Result<()> {
    let raw = run(&["join", network_id])?;
    parse_join_leave_result(&raw)
}

pub fn leave(network_id: &str) -> anyhow::Result<()> {
    let raw = run(&["leave", network_id])?;
    parse_join_leave_result(&raw)
}

/// `zerotier-cli join`/`leave` print a `200 <cmd> OK` style line on success
/// rather than exiting non-zero on failure, so the real signal is the text.
fn parse_join_leave_result(raw: &str) -> anyhow::Result<()> {
    if raw.trim_start().starts_with("200") {
        Ok(())
    } else {
        Err(anyhow::anyhow!(raw.trim().to_string()))
    }
}

#[cfg(test)]
#[path = "tests/cli_tests.rs"]
mod tests;
