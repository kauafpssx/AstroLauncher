use std::path::{Path, PathBuf};

use mc_launcher_core::account::Account;
use mc_launcher_core::command::builder::{build_launch_command, LaunchOptions};
use mc_launcher_core::core::version::VersionJson;

pub struct BuiltCommand {
    pub executable: PathBuf,
    pub args: Vec<String>,
    pub working_dir: PathBuf,
}

/// Builds the final Java command for a merged Forge/NeoForge version:
/// classpath, main class, and the loader's own JVM/game argument templates
/// (module `--add-opens`/`--add-exports`, `--launchTarget`, etc.) that our
/// own hand-rolled `spawn_game` doesn't generate.
#[allow(clippy::too_many_arguments)]
pub fn build_command(
    minecraft_dir: &Path,
    version: &VersionJson,
    java_bin: &Path,
    game_dir: &Path,
    natives_dir: &Path,
    username: &str,
    uuid: &str,
    resolution: Option<(u32, u32)>,
) -> anyhow::Result<BuiltCommand> {
    let options = LaunchOptions {
        account: Account::Offline {
            username: username.to_string(),
            uuid: uuid.to_string(),
        },
        java_executable: Some(java_bin.to_path_buf()),
        game_directory: Some(game_dir.to_path_buf()),
        natives_directory: Some(natives_dir.to_path_buf()),
        custom_resolution: resolution,
        ..Default::default()
    };
    // Fullscreen has no launch-argument equivalent (see `options_file` in
    // `infrastructure::minecraft`) — it's applied by writing `options.txt`
    // before spawning, same as the vanilla/Fabric/Quilt/LiteLoader path.
    let command = build_launch_command(version, minecraft_dir.to_path_buf(), options)?;
    Ok(BuiltCommand {
        executable: command.executable,
        args: command.args,
        working_dir: command.working_dir,
    })
}
