use std::path::Path;

use super::detect;
use super::download;

fn bundled_java_bin(app_data_dir: &Path, major: u32) -> std::path::PathBuf {
    let bin_name = if cfg!(target_os = "windows") {
        "java.exe"
    } else {
        "java"
    };
    app_data_dir
        .join("java")
        .join(major.to_string())
        .join("bin")
        .join(bin_name)
}

/// Resolves a Java binary that satisfies `required_major`: prefers the
/// system Java if it's new enough, otherwise reuses (or downloads) a
/// portable Adoptium JRE under `<app_data_dir>/java/<major>/`.
pub async fn ensure_java(
    app_data_dir: &Path,
    required_major: u32,
    http_client: &reqwest::Client,
    on_stage: impl Fn(&str),
) -> anyhow::Result<String> {
    if let Ok(system_java) = detect::find_java() {
        if let Ok(major) = detect::detect_major_version(&system_java) {
            if major >= required_major {
                return Ok(system_java);
            }
        }
    }

    let bundled = bundled_java_bin(app_data_dir, required_major);
    if bundled.exists() {
        return Ok(bundled.display().to_string());
    }

    on_stage(&format!("Baixando Java {required_major} (portátil)"));
    let dest_dir = app_data_dir.join("java").join(required_major.to_string());
    download::download_portable_jre(http_client, required_major, &dest_dir).await?;

    if !bundled.exists() {
        return Err(anyhow::anyhow!(
            "Falha ao preparar o Java {required_major} portátil"
        ));
    }
    Ok(bundled.display().to_string())
}
