use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use anyhow::Context;

/// Prevents the PowerShell console window from flashing on the user's screen
/// when spawning the process: every `Command` on Windows runs hidden.
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Single-quotes a PowerShell string literal, doubling embedded quotes.
pub(super) fn ps_single(value: &str) -> String {
    format!("'{}'", value.replace('\'', "''"))
}

pub(super) fn run_powershell(script: &str) -> anyhow::Result<String> {
    let mut cmd = Command::new("powershell");
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", script]);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let output = cmd.output().context("failed to run powershell")?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("powershell exited with {}: {stderr}", output.status);
    }
    String::from_utf8(output.stdout).context("powershell output was not valid UTF-8")
}
