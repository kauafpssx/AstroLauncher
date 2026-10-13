use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{Monitor, PhysicalPosition, PhysicalSize, WebviewWindow};

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
    let max_y = m_pos.y + m_size.height as i32 - MIN_VISIBLE_PX;

    PhysicalPosition::new(
        position.x.clamp(min_x.min(max_x), max_x.max(min_x)),
        position.y.clamp(m_pos.y, max_y.max(m_pos.y)),
    )
}

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

pub fn save(app_data_dir: &Path, window: &WebviewWindow) {
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

pub fn restore(app_data_dir: &Path, window: &WebviewWindow) {
    let Ok(content) = std::fs::read_to_string(state_path(app_data_dir)) else {
        return;
    };
    let Ok(state) = serde_json::from_str::<WindowState>(&content) else {
        return;
    };
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
