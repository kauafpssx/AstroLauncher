use std::path::{Path, PathBuf};

use anyhow::Context;

/// Wraps raw PNG bytes in a minimal single-image `.ico` container. Windows
/// has natively supported a PNG payload inside `.ico` (instead of a legacy
/// BMP bitmap) since Vista, so this needs no actual image decoding — which
/// matters because GDI+ (`System.Drawing.Bitmap.FromFile`, the "obvious" way
/// to build an `.ico` on Windows) throws a generic `OutOfMemoryException` on
/// PNGs carrying a color-profile chunk, which is exactly what Chromium/
/// WebView2's `canvas.toDataURL('image/png')` embeds — i.e. every custom
/// uploaded/cropped icon. Reading the width/height straight from the PNG's
/// `IHDR` chunk (always the first 8 bytes after the fixed PNG signature)
/// sidesteps decoding it at all.
///
/// ICO layout: 6-byte `ICONDIR` header, one 16-byte `ICONDIRENTRY`, then the
/// image bytes — see the MS-ICO format spec.
fn wrap_png_as_ico(png_bytes: &[u8]) -> anyhow::Result<Vec<u8>> {
    if png_bytes.len() < 24 {
        anyhow::bail!("icon PNG is too small to be valid");
    }
    let width = u32::from_be_bytes(png_bytes[16..20].try_into().unwrap());
    let height = u32::from_be_bytes(png_bytes[20..24].try_into().unwrap());
    // ICONDIRENTRY stores 0-255 dimensions, where 0 means 256px.
    let dim_byte = |d: u32| if d >= 256 { 0 } else { d as u8 };

    let mut ico = Vec::with_capacity(22 + png_bytes.len());
    ico.extend_from_slice(&0u16.to_le_bytes()); // reserved
    ico.extend_from_slice(&1u16.to_le_bytes()); // type: icon
    ico.extend_from_slice(&1u16.to_le_bytes()); // image count
    ico.push(dim_byte(width));
    ico.push(dim_byte(height));
    ico.push(0); // color count (0 = no palette)
    ico.push(0); // reserved
    ico.extend_from_slice(&1u16.to_le_bytes()); // color planes
    ico.extend_from_slice(&32u16.to_le_bytes()); // bits per pixel
    ico.extend_from_slice(&(png_bytes.len() as u32).to_le_bytes()); // image size
    ico.extend_from_slice(&22u32.to_le_bytes()); // image offset (6 + 16)
    ico.extend_from_slice(png_bytes);
    Ok(ico)
}

/// Writes the given PNG bytes under `<app_data_dir>/data/shortcut_icons/` and
/// wraps them into an `.ico` there, returning its path to point the shortcut
/// at. Re-run on every `create()` so an icon change is picked up.
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
