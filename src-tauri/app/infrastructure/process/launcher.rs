use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use crate::infrastructure::minecraft::version_meta::VersionMeta;

pub struct LaunchOptions<'a> {
    pub java_bin: &'a str,
    pub client_jar: &'a Path,
    pub natives_dir: &'a Path,
    pub assets_dir: &'a Path,
    pub game_dir: &'a Path,
    pub version_meta: &'a VersionMeta,
    /// The class actually invoked — the vanilla client's main class, or a mod
    /// loader's own entry point (e.g. Fabric/Quilt's Knot launcher) when one
    /// is installed.
    pub main_class: &'a str,
    pub username: &'a str,
    pub uuid: &'a str,
    pub min_memory_mb: i64,
    pub max_memory_mb: i64,
    /// Extra JVM flags some loaders require (e.g. Forge's module `--add-opens`
    /// set on 1.17+) — inserted before `-cp`. Empty for vanilla/Fabric/Quilt.
    pub extra_jvm_args: &'a [String],
    /// Extra game arguments some loaders require (e.g. LiteLoader's
    /// `--tweakClass`) — appended after Mojang's standard set.
    pub extra_game_args: &'a [String],
}

/// Resolves a Maven coordinate (`group:artifact:version[:classifier]`) to the
/// on-disk jar path used by Mojang's launcher layout.
pub fn library_path(libraries_dir: &Path, maven_name: &str) -> PathBuf {
    let parts: Vec<&str> = maven_name.split(':').collect();
    let (group, artifact, version) = (parts[0], parts[1], parts[2]);
    let group_path = group.replace('.', "/");
    let file_name = match parts.get(3) {
        Some(classifier) => format!("{artifact}-{version}-{classifier}.jar"),
        None => format!("{artifact}-{version}.jar"),
    };
    libraries_dir.join(group_path).join(artifact).join(version).join(file_name)
}

pub fn extract_natives(jar_path: &Path, dest: &Path) -> anyhow::Result<()> {
    let file = std::fs::File::open(jar_path)?;
    let mut archive = zip::ZipArchive::new(file)?;
    std::fs::create_dir_all(dest)?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i)?;
        let name = entry.name().to_string();
        if name.ends_with('/') || !(name.ends_with(".dll") || name.ends_with(".so") || name.ends_with(".dylib")) {
            continue;
        }
        let Some(file_name) = Path::new(&name).file_name() else { continue };
        let mut out_file = std::fs::File::create(dest.join(file_name))?;
        std::io::copy(&mut entry, &mut out_file)?;
    }
    Ok(())
}

pub fn build_classpath(libraries: &[PathBuf], client_jar: &Path) -> String {
    let mut paths: Vec<String> = libraries.iter().map(|p| p.display().to_string()).collect();
    paths.push(client_jar.display().to_string());
    paths.join(if cfg!(target_os = "windows") { ";" } else { ":" })
}

pub fn spawn_game(options: LaunchOptions, classpath: &str, log_path: &Path) -> anyhow::Result<std::process::Child> {
    let mut args: Vec<String> = Vec::new();
    args.push(format!("-Xms{}M", options.min_memory_mb));
    args.push(format!("-Xmx{}M", options.max_memory_mb));
    args.push(format!("-Djava.library.path={}", options.natives_dir.display()));
    args.extend(options.extra_jvm_args.iter().cloned());
    args.push("-cp".to_string());
    args.push(classpath.to_string());
    args.push(options.main_class.to_string());
    args.push("--username".to_string());
    args.push(options.username.to_string());
    args.push("--version".to_string());
    args.push(options.version_meta.id.clone());
    args.push("--gameDir".to_string());
    args.push(options.game_dir.display().to_string());
    args.push("--assetsDir".to_string());
    args.push(options.assets_dir.display().to_string());
    args.push("--assetIndex".to_string());
    args.push(options.version_meta.asset_index.id.clone());
    args.push("--uuid".to_string());
    args.push(options.uuid.to_string());
    args.push("--accessToken".to_string());
    args.push("0".to_string());
    args.push("--userType".to_string());
    args.push("legacy".to_string());
    args.push("--versionType".to_string());
    args.push("release".to_string());
    args.extend(options.extra_game_args.iter().cloned());

    spawn_with_parts(Path::new(options.java_bin), &args, options.game_dir, log_path)
}

/// Spawns a Java process with a pre-built argument list, piping stdout/stderr
/// to the instance's log file. Shared by the vanilla/Fabric/Quilt/LiteLoader
/// argument builder above and the Forge/NeoForge branch, which builds its
/// argument list via `mc-launcher-core`'s command builder instead.
pub fn spawn_with_parts(java_bin: &Path, args: &[String], game_dir: &Path, log_path: &Path) -> anyhow::Result<std::process::Child> {
    if let Some(parent) = log_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::create_dir_all(game_dir)?;
    let log_file = std::fs::File::create(log_path)?;

    Command::new(java_bin)
        .current_dir(game_dir)
        .args(args)
        .stdout(Stdio::from(log_file.try_clone()?))
        .stderr(Stdio::from(log_file))
        .spawn()
        .map_err(anyhow::Error::from)
}
