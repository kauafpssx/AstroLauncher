use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use anyhow::Context;

/// Impede que a janela do console (PowerShell) pisque na tela do usuário ao
/// spawnar o processo — todo `Command` no Windows roda oculto.
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Flag used in the shortcut's Arguments so we can later map a `.lnk` back to
/// the instance it launches (`--launch-instance <id>`).
const LAUNCH_FLAG: &str = "--launch-instance";

fn desktop_dir() -> anyhow::Result<PathBuf> {
    dirs::desktop_dir().context("failed to resolve desktop directory")
}

/// The `.lnk` filename is derived from the instance name (Windows forbids a
/// handful of characters in filenames), so those are swapped for underscores.
fn sanitized_name(name: &str) -> String {
    let cleaned: String = name
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => c,
        })
        .collect();
    let trimmed = cleaned.trim();
    if trimmed.is_empty() {
        "Atalho".to_string()
    } else {
        trimmed.to_string()
    }
}

fn shortcut_path(name: &str) -> anyhow::Result<PathBuf> {
    Ok(desktop_dir()?.join(format!("{}.lnk", sanitized_name(name))))
}

/// Single-quotes a PowerShell string literal, doubling embedded quotes.
fn ps_single(value: &str) -> String {
    format!("'{}'", value.replace('\'', "''"))
}

fn run_powershell(script: &str) -> anyhow::Result<String> {
    let mut cmd = Command::new("powershell");
    cmd.args(["-NoProfile", "-NonInteractive", "-Command", script]);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let output = cmd.output().context("failed to run powershell")?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("powershell exited with {}: {stderr}", output.status);
    }
    String::from_utf8(output.stdout).context("powershell output was not valid UTF-8")
}

fn parse_shortcut_instance_id(args: &str) -> Option<String> {
    let mut parts = args.split_whitespace();
    while let Some(part) = parts.next() {
        if part == LAUNCH_FLAG {
            return parts.next().map(|id| id.to_string());
        }
    }
    None
}

/// Enumerates the desktop `.lnk` files that target this launcher (identified
/// by the `--launch-instance` flag), returning `(path, instance_id)` pairs.
fn list_shortcuts() -> anyhow::Result<Vec<(PathBuf, String)>> {
    let dir = desktop_dir()?;
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let script = format!(
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n\
         Get-ChildItem -LiteralPath {} -Filter '*.lnk' -File | ForEach-Object {{ \
         try {{ $ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut($_.FullName); \
         \"$($sc.Arguments)|$($_.FullName)\" }} catch {{}} }}",
        ps_single(&dir.to_string_lossy())
    );

    let mut shortcuts = Vec::new();
    for line in run_powershell(&script)?.lines() {
        let Some((args, path)) = line.split_once('|') else {
            continue;
        };
        let Some(id) = parse_shortcut_instance_id(args) else {
            continue;
        };
        shortcuts.push((PathBuf::from(path), id));
    }
    Ok(shortcuts)
}

pub fn list_instance_ids() -> anyhow::Result<Vec<String>> {
    let mut ids: Vec<String> = list_shortcuts()?.into_iter().map(|(_, id)| id).collect();
    ids.sort();
    ids.dedup();
    Ok(ids)
}

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
fn write_icon(app_data_dir: &Path, instance_id: &str, png_bytes: &[u8]) -> anyhow::Result<PathBuf> {
    let dir = app_data_dir.join("data").join("shortcut_icons");
    std::fs::create_dir_all(&dir).context("failed to create shortcut_icons dir")?;
    let ico_path = dir.join(format!("{instance_id}.ico"));
    std::fs::write(&ico_path, wrap_png_as_ico(png_bytes)?)
        .context("failed to write shortcut icon")?;
    Ok(ico_path)
}

/// Creates (or refreshes) the desktop shortcut for an instance. Any previous
/// shortcut for the same instance is removed first so a rename never leaves a
/// stale duplicate behind.
pub fn create(
    instance_id: &str,
    name: &str,
    icon_png: Option<&[u8]>,
    app_data_dir: &Path,
) -> anyhow::Result<()> {
    remove_by_id(instance_id)?;

    let path = shortcut_path(name)?;
    let exe = std::env::current_exe().context("failed to resolve current executable")?;
    let working_dir = exe
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_default();

    let icon_path = icon_png
        .map(|bytes| write_icon(app_data_dir, instance_id, bytes))
        .transpose()?;

    let mut script = String::from("$ws = New-Object -ComObject WScript.Shell\n");
    script.push_str(&format!(
        "$sc = $ws.CreateShortcut({})\n",
        ps_single(&path.to_string_lossy())
    ));
    script.push_str(&format!(
        "$sc.TargetPath = {}\n",
        ps_single(&exe.to_string_lossy())
    ));
    script.push_str(&format!(
        "$sc.Arguments = {}\n",
        ps_single(&format!("{LAUNCH_FLAG} {instance_id}"))
    ));
    script.push_str(&format!(
        "$sc.WorkingDirectory = {}\n",
        ps_single(&working_dir)
    ));
    if let Some(icon) = &icon_path {
        // The `,0` (icon index) must be part of the same quoted string — a
        // bare `'path',0` is PowerShell's array-construction operator, not
        // string concatenation, so assigning it to IconLocation silently
        // sets a 2-element array instead and the COM property write no-ops.
        script.push_str(&format!(
            "$sc.IconLocation = {}\n",
            ps_single(&format!("{},0", icon.to_string_lossy()))
        ));
    }
    script.push_str("$sc.Save()\n");
    // Explorer caches shell icons aggressively and won't notice a `.lnk`
    // pointing at an already-known path got a new icon (or an icon at all)
    // until something tells it to look again — without this, the desktop
    // keeps showing a generic placeholder until the user manually reopens
    // the shortcut's properties dialog.
    script.push_str(&notify_shell_icons_changed_script());

    run_powershell(&script)?;
    Ok(())
}

/// PowerShell snippet that broadcasts `SHChangeNotify(SHCNE_ASSOCCHANGED)` so
/// Explorer re-reads icon associations instead of serving its stale cache.
fn notify_shell_icons_changed_script() -> String {
    "Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;\
     public class AstroShellNotify{[DllImport(\"shell32.dll\")]\
     public static extern void SHChangeNotify(int e,uint f,IntPtr i1,IntPtr i2);}'\n\
     [AstroShellNotify]::SHChangeNotify(0x8000000, 0, [IntPtr]::Zero, [IntPtr]::Zero)\n"
        .to_string()
}

/// Removes the desktop shortcut for an instance, if one exists.
pub fn remove_by_id(instance_id: &str) -> anyhow::Result<bool> {
    let Some(path) = list_shortcuts()?
        .into_iter()
        .find(|(_, id)| id == instance_id)
        .map(|(path, _)| path)
    else {
        return Ok(false);
    };
    std::fs::remove_file(&path)
        .with_context(|| format!("failed to remove shortcut {}", path.display()))?;
    Ok(true)
}
