use std::path::{Path, PathBuf};

use mc_launcher_core::core::version::VersionJson;
use mc_launcher_core::install::client::{
    fetch_vanilla_version, install_version_files, load_version_json, write_version_json,
};
use mc_launcher_core::install::loader::{installer_command_args, InstallerInvocation};
use mc_launcher_core::net::download::{execute_plan, DownloadPlan, DownloadTask};
use mc_launcher_core::progress::ProgressReporter;

use super::kind_for;

/// Persists the vanilla version JSON to `<minecraft_dir>/versions/<id>/<id>.json`
/// Required for the Forge/NeoForge profile's `inheritsFrom` merge to find
/// its parent. Our own launch pipeline only ever keeps this in memory.
pub fn ensure_vanilla_json_on_disk(minecraft_dir: &Path, mc_version: &str) -> anyhow::Result<()> {
    let version = fetch_vanilla_version(mc_version)?;
    write_version_json(minecraft_dir, &version)?;
    Ok(())
}

/// Forge/NeoForge's installer jar hardcodes a check for `launcher_profiles.json`
/// in the target dir and aborts with "There is no minecraft launcher profile
/// in ..., you need to run the launcher first!" if it's missing: a leftover
/// assumption from the vanilla Mojang launcher. AstroLauncher never writes
/// this file, so we stub a minimal valid one before invoking the installer.
/// Only created if absent: never overwrites a real profile file.
pub fn ensure_launcher_profile_stub(minecraft_dir: &Path) -> anyhow::Result<()> {
    let profile_path = minecraft_dir.join("launcher_profiles.json");
    if profile_path.exists() {
        return Ok(());
    }
    std::fs::create_dir_all(minecraft_dir)?;
    std::fs::write(
        &profile_path,
        r#"{"profiles":{},"settings":{},"version":3}"#,
    )?;
    Ok(())
}

/// Runs the downloaded installer jar with our own resolved Java runtime.
/// Blocking: spawns `java -jar installer.jar --installClient <dir>` and
/// waits for it to exit.
///
/// Builds and spawns the process ourselves instead of calling the crate's
/// own `run_loader_installer` — that helper doesn't set `CREATE_NO_WINDOW`,
/// so the installer would flash a console window (same reasoning as
/// `process/launcher.rs` bypassing the crate's `Launcher` facade for the
/// actual game process). Still reuses `installer_command_args` so the
/// argument list stays in sync with the crate.
pub fn run_installer(
    java_bin: &Path,
    installer_path: &Path,
    minecraft_dir: &Path,
    loader: &str,
) -> anyhow::Result<()> {
    let Some(kind) = kind_for(loader) else {
        anyhow::bail!("Loader '{loader}' não é Forge nem NeoForge");
    };
    let args = installer_command_args(&InstallerInvocation {
        loader: kind,
        java_executable: java_bin.to_path_buf(),
        installer_path: installer_path.to_path_buf(),
        minecraft_dir: minecraft_dir.to_path_buf(),
    });

    let mut cmd = std::process::Command::new(java_bin);
    cmd.args(&args);
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let status = cmd.status()?;
    if !status.success() {
        anyhow::bail!(
            "Instalador do {loader} falhou (código de saída: {:?})",
            status.code()
        );
    }
    Ok(())
}

/// Loads the merged version JSON (Forge/NeoForge profile + inherited vanilla
/// metadata): main class, full library set, and JVM/game argument templates.
pub fn load_merged_version(minecraft_dir: &Path, version_id: &str) -> anyhow::Result<VersionJson> {
    Ok(load_version_json(minecraft_dir, version_id)?)
}

/// Downloads the client jar, merged libraries, assets, and extracts natives
/// for the given (already merged) version. Replaces our own per-library
/// download loop and asset downloader for this loader family only.
///
/// Forwards the crate's raw `ProgressEvent`s instead of pre-formatting them:
/// mapping to a user-facing label/DTO is a presentation concern that belongs
/// in the use case, not in this infra wrapper.
pub fn install_files(
    version: &VersionJson,
    minecraft_dir: &Path,
    mut on_progress: impl FnMut(mc_launcher_core::progress::ProgressEvent) + Send,
) -> anyhow::Result<()> {
    struct Bridge<F: FnMut(mc_launcher_core::progress::ProgressEvent)>(F);
    impl<F: FnMut(mc_launcher_core::progress::ProgressEvent)> ProgressReporter for Bridge<F> {
        fn report(&mut self, event: mc_launcher_core::progress::ProgressEvent) {
            (self.0)(event);
        }
    }
    let mut reporter = Bridge(&mut on_progress);
    install_version_files(version, minecraft_dir, &mut reporter)?;
    Ok(())
}

pub fn installer_local_path(minecraft_dir: &Path, loader: &str, loader_version: &str) -> PathBuf {
    minecraft_dir
        .join("versions")
        .join(".installers")
        .join(format!("{loader}-{loader_version}-installer.jar"))
}

/// Downloads the installer jar to `installer_local_path`. Blocking.
pub fn download_installer(
    minecraft_dir: &Path,
    loader: &str,
    loader_version: &str,
    url: &str,
) -> anyhow::Result<PathBuf> {
    let destination = installer_local_path(minecraft_dir, loader, loader_version);
    let plan = DownloadPlan {
        tasks: vec![DownloadTask {
            url: url.to_string(),
            destination: destination.clone(),
            checksum: None,
            label: format!("{loader} installer {loader_version}"),
        }],
    };
    let mut reporter = |_event: mc_launcher_core::progress::ProgressEvent| {};
    execute_plan(&plan, &mut reporter)?;
    Ok(destination)
}
