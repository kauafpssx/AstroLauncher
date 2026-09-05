use std::collections::HashSet;
use std::path::{Path, PathBuf};

use mc_launcher_core::core::maven::MavenCoordinate;
use mc_launcher_core::core::version::{Library, VersionJson};
use mc_launcher_core::install::client::{
    fetch_vanilla_version, install_version_files, load_version_json, write_version_json,
};
use mc_launcher_core::install::loader::{installer_command_args, InstallerInvocation};
use mc_launcher_core::net::download::{execute_plan, DownloadPlan, DownloadTask};
use mc_launcher_core::progress::ProgressReporter;

use super::kind_for;

pub fn ensure_vanilla_json_on_disk(minecraft_dir: &Path, mc_version: &str) -> anyhow::Result<()> {
    let version = fetch_vanilla_version(mc_version)?;
    write_version_json(minecraft_dir, &version)?;
    Ok(())
}

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
    let output = cmd.output()?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let mut tail_lines: Vec<&str> = stderr.lines().rev().take(10).collect();
        tail_lines.reverse();
        let tail = tail_lines.join("\n");
        anyhow::bail!(
            "Instalador do {loader} falhou (código de saída: {:?}):\n{tail}",
            output.status.code()
        );
    }
    Ok(())
}

pub fn load_merged_version(minecraft_dir: &Path, version_id: &str) -> anyhow::Result<VersionJson> {
    let mut version = load_version_json(minecraft_dir, version_id)?;
    version.libraries = dedupe_libraries(version.libraries);
    Ok(version)
}

fn dedupe_libraries(libraries: Vec<Library>) -> Vec<Library> {
    let mut seen = HashSet::new();
    let mut kept: Vec<Library> = libraries
        .into_iter()
        .rev()
        .filter(|library| {
            let key = MavenCoordinate::parse(&library.name)
                .map(|c| (c.group, c.artifact, c.classifier))
                .unwrap_or_else(|_| (library.name.clone(), String::new(), None));
            seen.insert(key)
        })
        .collect();
    kept.reverse();
    kept
}

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
