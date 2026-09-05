use mc_launcher_core::loader::{forge, neoforge, LoaderKind};

mod command;
mod install;

pub use command::{build_command, BuiltCommand};
pub use install::{
    download_installer, ensure_launcher_profile_stub, ensure_vanilla_json_on_disk, install_files,
    installer_local_path, load_merged_version, run_installer,
};

fn kind_for(loader: &str) -> Option<LoaderKind> {
    match loader {
        "forge" => Some(LoaderKind::Forge),
        "neoforge" => Some(LoaderKind::NeoForge),
        _ => None,
    }
}

pub fn is_supported(loader: &str) -> bool {
    kind_for(loader).is_some()
}

pub fn normalize_loader_version(loader: &str, mc_version: &str, loader_version: &str) -> String {
    let already_prefixed = loader_version.starts_with(&format!("{mc_version}-"));
    if loader == "forge" && !already_prefixed {
        format!("{mc_version}-{loader_version}")
    } else {
        loader_version.to_string()
    }
}

pub fn resolve_loader_version(loader: &str, mc_version: &str) -> anyhow::Result<String> {
    match kind_for(loader) {
        Some(LoaderKind::Forge) => {
            let versions = forge::list_forge_versions()?;
            Ok(forge::latest_for_minecraft(&versions, mc_version)?.to_string())
        }
        Some(LoaderKind::NeoForge) => {
            let versions = neoforge::list_neoforge_versions()?;
            Ok(neoforge::latest_for_minecraft(&versions, mc_version)?.to_string())
        }
        _ => anyhow::bail!("Loader '{loader}' não é Forge nem NeoForge"),
    }
}

pub fn installer_url(loader: &str, loader_version: &str) -> anyhow::Result<String> {
    match kind_for(loader) {
        Some(LoaderKind::Forge) => Ok(forge::installer_url(loader_version)),
        Some(LoaderKind::NeoForge) => Ok(neoforge::installer_url(loader_version)),
        _ => anyhow::bail!("Loader '{loader}' não é Forge nem NeoForge"),
    }
}

pub fn installed_version_id(
    loader: &str,
    mc_version: &str,
    loader_version: &str,
) -> anyhow::Result<String> {
    match kind_for(loader) {
        Some(LoaderKind::Forge) => Ok(forge::forge_installed_version_id(loader_version)?),
        Some(LoaderKind::NeoForge) => Ok(neoforge::neoforge_installed_version_id(
            mc_version,
            loader_version,
        )),
        _ => anyhow::bail!("Loader '{loader}' não é Forge nem NeoForge"),
    }
}

#[cfg(test)]
#[path = "forge_like/version_tests.rs"]
mod tests;
