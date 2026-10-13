use std::path::{Path, PathBuf};

use mc_launcher_core::account::Account;
use mc_launcher_core::command::builder::{build_launch_command, LaunchOptions};
use mc_launcher_core::core::version::VersionJson;

pub struct BuiltCommand {
    pub executable: PathBuf,
    pub args: Vec<String>,
    pub working_dir: PathBuf,
}

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
    let command = build_launch_command(version, minecraft_dir.to_path_buf(), options)?;
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
