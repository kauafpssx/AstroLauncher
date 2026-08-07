use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

/// Minimum sliver of the window (in physical px) that must stay inside the
/// monitor's bounds so the user can always see and drag it back — without
/// this, a window closed while dragged off-screen (or onto a monitor that
/// got unplugged/rearranged since) reopens somewhere the user can never
/// reach, looking like the app silently fails to show up at all.
const MIN_VISIBLE_PX: i32 = 120;

fn clamp_to_monitor(
    position: PhysicalPosition<i32>,
    size: PhysicalSize<u32>,
    monitor: &Monitor,
) -> PhysicalPosition<i32> {
    let m_pos = monitor.position();
    let m_size = monitor.size();

    let max_x = m_pos.x + m_size.width as i32 - MIN_VISIBLE_PX;
    let min_x = m_pos.x - size.width as i32 + MIN_VISIBLE_PX;
    // Never let the top edge go above the monitor: once the title bar is
    // off-screen there's no way to drag the window back down.
    let max_y = m_pos.y + m_size.height as i32 - MIN_VISIBLE_PX;

    PhysicalPosition::new(
        position.x.clamp(min_x.min(max_x), max_x.max(min_x)),
        position.y.clamp(m_pos.y, max_y.max(m_pos.y)),
    )
}

/// Position/size are stored as an offset from the monitor's own origin
/// (not absolute virtual-screen coordinates) plus the monitor's name:
/// restoring by re-adding that offset to whichever monitor currently has
/// that name sidesteps the well-known upstream bug in
/// `tauri-plugin-window-state` where a maximized window reopens on the
/// wrong monitor when monitors have different DPI scale factors
/// (tauri-apps/plugins-workspace#244): that plugin restores physical
/// bounds before the window has picked up its target monitor's scale
/// factor, so `set_size` rescales them using the *previous* monitor's
/// factor. Storing monitor-relative offsets and always setting position
/// before size (both in physical units, so nothing gets rescaled) avoids
/// that class of bug entirely.
#[derive(Debug, Clone, Serialize, Deserialize)]
struct WindowState {
    monitor_name: Option<String>,
    offset_x: i32,
    offset_y: i32,
    width: u32,
    height: u32,
    maximized: bool,
}

fn state_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("window-state.json")
}

/// Captures the window's current bounds and writes them to disk. Call this
/// on `CloseRequested` for the main window: best-effort, a failure here
/// must never block the app from closing.
pub fn save(app_data_dir: &Path, window: &WebviewWindow) {
    // Windows reports a minimized window's placement as a sentinel rect
    // (historically `(-32000, -32000)`, 0×0) instead of its real restored
    // bounds — saving that verbatim and reapplying it next launch put the
    // window fully off-screen with no way to see or reach it. Skip the
    // write entirely rather than clobber a previously-good save with junk.
    if window.is_minimized().unwrap_or(false) {
        return;
    }
    let Ok(position) = window.outer_position() else {
        return;
    };
    let Ok(size) = window.inner_size() else {
        return;
    };
    if size.width == 0 || size.height == 0 {
        return;
    }
    let maximized = window.is_maximized().unwrap_or(false);
    let monitor = window.current_monitor().ok().flatten();
    let (monitor_name, offset_x, offset_y) = match &monitor {
        Some(m) => (
            m.name().cloned(),
            position.x - m.position().x,
            position.y - m.position().y,
        ),
        None => (None, position.x, position.y),
    };

    let state = WindowState {
        monitor_name,
        offset_x,
        offset_y,
        width: size.width,
        height: size.height,
        maximized,
    };

    let path = state_path(app_data_dir);
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string_pretty(&state) {
        let _ = std::fs::write(path, json);
    }
}

/// Applies the last saved bounds to the window, if any were saved. Falls
/// back to whatever monitor the window would normally open on when the
/// saved monitor is no longer connected. Best-effort: a failure here must
/// never block startup.
pub fn restore(app_data_dir: &Path, window: &WebviewWindow) {
    let Ok(content) = std::fs::read_to_string(state_path(app_data_dir)) else {
        return;
    };
    let Ok(state) = serde_json::from_str::<WindowState>(&content) else {
        return;
    };
    // Guards against a state file written before this validation existed
    // (e.g. captured while minimized, Windows' `(-32000, -32000)` sentinel).
    if state.width == 0 || state.height == 0 {
        return;
    }

    let target_monitor = state.monitor_name.as_deref().and_then(|name| {
        window
            .available_monitors()
            .ok()?
            .into_iter()
            .find(|m| m.name().map(String::as_str) == Some(name))
    });

    // Saved monitor is gone (unplugged, layout changed): offsets alone
    // aren't meaningful anymore, so leave the OS/config default position.
    if target_monitor.is_none() && state.monitor_name.is_some() {
        return;
    }
    let Some(monitor) = target_monitor.or_else(|| window.current_monitor().ok().flatten()) else {
        return;
    };

    let size = PhysicalSize::new(state.width, state.height);
    let raw_position = PhysicalPosition::new(
        monitor.position().x + state.offset_x,
        monitor.position().y + state.offset_y,
    );
    let position = clamp_to_monitor(raw_position, size, &monitor);

    let _ = window.set_position(position);
    let _ = window.set_size(size);
    if state.maximized {
        let _ = window.maximize();
    }
}
