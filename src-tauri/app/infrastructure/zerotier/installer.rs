use std::path::Path;

use super::cli;
/// ZeroTier doesn't publish per-version release metadata like Adoptium does;
/// this link always resolves to the latest stable Windows x64 build. Sourced
/// from `plugins.env` in `tauri.conf.json` like every other external URL.
#[cfg(target_os = "windows")]
fn msi_url() -> &'static str {
    crate::infrastructure::config::api()
        .zerotier_download
        .as_str()
}

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(target_os = "windows")]
fn ps_single(value: &str) -> String {
    format!("'{}'", value.replace('\'', "''"))
}

/// Downloads the official ZeroTier One installer and runs it elevated and
/// silent (`/quiet /norestart`): the ZeroTier client needs a signed TAP/tun
/// network driver, which only ships through this installer — there is no
/// portable/driverless distribution to unzip the way Java's JRE has.
///
/// A UAC consent prompt is unavoidable (Windows requires it for driver
/// installation regardless of `/quiet`), but no installer wizard is shown
/// once the user approves it. The downloaded MSI is Authenticode-verified
/// before it runs elevated so a tampered download can never silently
/// escalate.
#[cfg(target_os = "windows")]
pub async fn download_and_install(
    client: &reqwest::Client,
    app_data_dir: &Path,
) -> anyhow::Result<()> {
    let bytes = client
        .get(msi_url())
        .send()
        .await?
        .error_for_status()?
        .bytes()
        .await?;

    let dest_dir = app_data_dir.join("zerotier");
    tokio::fs::create_dir_all(&dest_dir).await?;
    let msi_path = dest_dir.join("ZeroTierOne.msi");
    tokio::fs::write(&msi_path, &bytes).await?;

    tokio::task::spawn_blocking(move || {
        verify_msi_signature(&msi_path)?;
        run_elevated_install(&msi_path)
    })
    .await??;

    if !cli::is_installed() {
        anyhow::bail!(
            "A instalação do ZeroTier One não foi concluída. Se a confirmação de administrador foi negada, instale manualmente em zerotier.com/download."
        );
    }
    Ok(())
}

/// Rejects a downloaded MSI that is not Authenticode-signed by ZeroTier: the
/// file is fetched over HTTPS from the official host, but the signature is
/// the last line of defense before it runs with administrator privileges.
#[cfg(target_os = "windows")]
fn verify_msi_signature(msi_path: &Path) -> anyhow::Result<()> {
    let msi_literal = ps_single(&msi_path.display().to_string());
    let script = format!(
        "$s = Get-AuthenticodeSignature -FilePath {msi_literal}; \
         if ($s.Status -ne 'Valid') {{ Write-Error ('Signature status: ' + $s.Status); exit 1 }}; \
         if ($s.SignerCertificate.Subject -notmatch 'ZeroTier') {{ Write-Error ('Unexpected signer: ' + $s.SignerCertificate.Subject); exit 2 }}"
    );
    let mut cmd = std::process::Command::new("powershell");
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", &script]);
    cmd.creation_flags(CREATE_NO_WINDOW);
    let output = cmd.output()?;
    if !output.status.success() {
        anyhow::bail!(
            "A assinatura do instalador do ZeroTier não pôde ser verificada: {}",
            String::from_utf8_lossy(&output.stderr)
        );
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub async fn download_and_install(
    _client: &reqwest::Client,
    _app_data_dir: &Path,
) -> anyhow::Result<()> {
    anyhow::bail!(
        "Instalação automática só é suportada no Windows. Instale o ZeroTier One pelo gerenciador de pacotes do seu sistema."
    )
}

#[cfg(target_os = "windows")]
fn run_elevated_install(msi_path: &Path) -> anyhow::Result<()> {
    let msi_literal = ps_single(&msi_path.display().to_string());
    let script = format!(
        "Start-Process msiexec.exe -ArgumentList '/i',{msi_literal},'/quiet','/norestart' -Verb RunAs -Wait -ErrorAction Stop"
    );
    let mut cmd = std::process::Command::new("powershell");
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", &script]);
    cmd.creation_flags(CREATE_NO_WINDOW);
    let output = cmd.output()?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("canceled by the user") || stderr.contains("refused the request") {
            anyhow::bail!(
                "Instalação cancelada: a confirmação de administrador não foi concedida. Você pode instalar manualmente em zerotier.com/download."
            );
        }
        anyhow::bail!("Falha ao instalar o ZeroTier One: {stderr}");
    }
    Ok(())
}
