mod dto;
mod files;
mod mods;
mod search;

pub use dto::*;
pub use files::*;
pub use mods::*;
pub use search::*;

fn base_url() -> &'static str {
    crate::infrastructure::config::api().curseforge.as_str()
}

fn mod_loader_type(loader: &str) -> Option<u32> {
    match loader {
        "forge" => Some(1),
        "fabric" => Some(4),
        "quilt" => Some(5),
        "neoforge" => Some(6),
        _ => None,
    }
}

pub const CLASS_ID_MOD: u32 = 6;
pub const CLASS_ID_MODPACK: u32 = 4471;
pub const CLASS_ID_RESOURCE_PACK: u32 = 12;
pub const CLASS_ID_SHADER: u32 = 6552;
