use std::path::{Path, PathBuf};

use anyhow::Context;

fn wrap_png_as_ico(png_bytes: &[u8]) -> anyhow::Result<Vec<u8>> {
    if png_bytes.len() < 24 {
        anyhow::bail!("icon PNG is too small to be valid");
    }
    let width = u32::from_be_bytes(png_bytes[16..20].try_into().unwrap());
    let height = u32::from_be_bytes(png_bytes[20..24].try_into().unwrap());
    let dim_byte = |d: u32| if d >= 256 { 0 } else { d as u8 };

    let mut ico = Vec::with_capacity(22 + png_bytes.len());
    ico.extend_from_slice(&0u16.to_le_bytes());
    ico.extend_from_slice(&1u16.to_le_bytes());
    ico.extend_from_slice(&1u16.to_le_bytes());
    ico.push(dim_byte(width));
    ico.push(dim_byte(height));
    ico.push(0);
    ico.push(0);
    ico.extend_from_slice(&1u16.to_le_bytes());
    ico.extend_from_slice(&32u16.to_le_bytes());
    ico.extend_from_slice(&(png_bytes.len() as u32).to_le_bytes());
    ico.extend_from_slice(&22u32.to_le_bytes());
    ico.extend_from_slice(png_bytes);
    Ok(ico)
}

pub(super) fn write_icon(
    app_data_dir: &Path,
    instance_id: &str,
    png_bytes: &[u8],
) -> anyhow::Result<PathBuf> {
    let dir = app_data_dir.join("data").join("shortcut_icons");
    std::fs::create_dir_all(&dir).context("failed to create shortcut_icons dir")?;
    let ico_path = dir.join(format!("{instance_id}.ico"));
    std::fs::write(&ico_path, wrap_png_as_ico(png_bytes)?)
        .context("failed to write shortcut icon")?;
    Ok(ico_path)
}
