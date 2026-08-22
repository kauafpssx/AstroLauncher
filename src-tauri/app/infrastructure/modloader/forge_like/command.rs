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
///
/// `natives_directory` is deliberately left unset (`None`): `install_files`
/// (see `install.rs`) extracts natives via the crate's own
/// `extract_natives_for_platform`, which always writes to
/// `<minecraft_dir>/versions/<version_id>/natives` — and `build_launch_command`
/// defaults to that exact same path when `natives_directory` is `None`. An
/// earlier version of this function pointed Java at `instance_dir/natives`
/// instead, a directory nothing ever populated for the Forge/NeoForge path,
/// which surfaced as `UnsatisfiedLinkError: Failed to locate library:
/// lwjgl.dll` at runtime — the natives were on disk, just not where the JVM
/// was told to look.
#[allow(clippy::too_many_arguments)]
pub fn build_command(
    minecraft_dir: &Path,
    version: &VersionJson,
    java_bin: &Path,
    game_dir: &Path,
    username: &str,
    uuid: &str,
    resolution: Option<(u32, u32)>,
    min_memory_mb: i64,
    max_memory_mb: i64,
) -> anyhow::Result<BuiltCommand> {
    let options = LaunchOptions {
        account: Account::Offline {
            username: username.to_string(),
            uuid: uuid.to_string(),
        },
        java_executable: Some(java_bin.to_path_buf()),
        game_directory: Some(game_dir.to_path_buf()),
        custom_resolution: resolution,
        ..Default::default()
    };
    // Fullscreen has no launch-argument equivalent (see `options_file` in
    // `infrastructure::minecraft`) — it's applied by writing `options.txt`
    // before spawning, same as the vanilla/Fabric/Quilt/LiteLoader path.
    let command = build_launch_command(version, minecraft_dir.to_path_buf(), options)?;
    // `LaunchOptions` (mc-launcher-core) has no memory field at all — without
    // this, Forge/NeoForge launches got no `-Xmx`/`-Xms` whatsoever and fell
    // back to the JVM's own heap heuristic, which reads as "stuck at 4096"
    // on machines where that heuristic lands there. Vanilla/Fabric/Quilt/
    // LiteLoader build their own JVM args in `launcher::spawn_game` (see
    // `LaunchOptions::min_memory_mb`/`max_memory_mb` there) and are unaffected.
    let mut args = command.args;
    args.splice(
        0..0,
        [
            format!("-Xms{min_memory_mb}M"),
            format!("-Xmx{max_memory_mb}M"),
        ],
    );
    Ok(BuiltCommand {
        executable: command.executable,
        args,
        working_dir: command.working_dir,
    })
}
