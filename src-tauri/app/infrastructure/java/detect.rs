use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn silent_command(bin: &str) -> Command {
    let mut cmd = Command::new(bin);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

/// Looks for a usable `java` binary. Bundled JRE management (per
/// docs/08-infraestrutura.md) is a follow-up; for now this relies on
/// JAVA_HOME or PATH.
pub fn find_java() -> anyhow::Result<String> {
    let candidate = std::env::var("JAVA_HOME")
        .map(|home| format!("{home}/bin/java"))
        .unwrap_or_else(|_| "java".to_string());

    match silent_command(&candidate).arg("-version").output() {
        Ok(_) => Ok(candidate),
        Err(_) => Err(anyhow::anyhow!(
            "Java não encontrado. Instale um JRE 17+ e garanta que está no PATH ou em JAVA_HOME."
        )),
    }
}

/// Parses the major version out of `java -version` output (printed to
/// stderr), handling both the legacy `1.8.0_x` scheme and the modern
/// `17`, `21.0.2` scheme.
pub fn detect_major_version(java_bin: &str) -> anyhow::Result<u32> {
    let output = silent_command(java_bin)
        .arg("-version")
        .output()
        .map_err(|e| anyhow::anyhow!("Não foi possível executar '{java_bin}': {e}"))?;

    let text = String::from_utf8_lossy(&output.stderr);
    let version_str = text
        .lines()
        .next()
        .and_then(|line| line.split('"').nth(1))
        .ok_or_else(|| anyhow::anyhow!("Não foi possível interpretar a versão do Java a partir de: {text}"))?;

    let mut parts = version_str.split('.');
    let first: u32 = parts.next().unwrap_or("0").parse().unwrap_or(0);
    if first == 1 {
        // Legacy scheme: "1.8.0_361" -> major version 8
        let second: u32 = parts.next().unwrap_or("0").parse().unwrap_or(0);
        Ok(second)
    } else {
        Ok(first)
    }
}
