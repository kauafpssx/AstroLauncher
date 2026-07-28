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
    if let Some(parent) = log_path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::create_dir_all(options.game_dir)?;
    let log_file = std::fs::File::create(log_path)?;

    Command::new(options.java_bin)
        .current_dir(options.game_dir)
        .arg(format!("-Xms{}M", options.min_memory_mb))
        .arg(format!("-Xmx{}M", options.max_memory_mb))
        .arg(format!("-Djava.library.path={}", options.natives_dir.display()))
        .arg("-cp")
        .arg(classpath)
        .arg(options.main_class)
        .arg("--username")
        .arg(options.username)
        .arg("--version")
        .arg(&options.version_meta.id)
        .arg("--gameDir")
        .arg(options.game_dir)
        .arg("--assetsDir")
        .arg(options.assets_dir)
        .arg("--assetIndex")
        .arg(&options.version_meta.asset_index.id)
        .arg("--uuid")
        .arg(options.uuid)
        .arg("--accessToken")
        .arg("0")
        .arg("--userType")
        .arg("legacy")
        .arg("--versionType")
        .arg("release")
        .stdout(Stdio::from(log_file.try_clone()?))
        .stderr(Stdio::from(log_file))
        .spawn()
        .map_err(anyhow::Error::from)
}
