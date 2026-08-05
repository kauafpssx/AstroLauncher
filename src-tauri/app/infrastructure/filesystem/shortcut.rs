use std::path::{Path, PathBuf};

use anyhow::Context;

mod icon;
mod powershell;

use icon::write_icon;
use powershell::{ps_single, run_powershell};

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
