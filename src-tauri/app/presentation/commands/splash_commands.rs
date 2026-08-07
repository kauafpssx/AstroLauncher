use tauri::{AppHandle, Manager};

use crate::infrastructure::window_state;

#[tauri::command]
pub fn finish_splash(app: AppHandle) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        // Applied right before showing, not during setup: `maximize()` has
        // no "hidden" state on Windows — calling it earlier while `main` is
        // still meant to be invisible forces it visible right then, flashing
        // it on screen underneath (and briefly instead of) the splash.
        if let Ok(app_data_dir) = app.path().app_data_dir() {
            window_state::restore(&app_data_dir, &main);
        }
        main.show().map_err(|e| e.to_string())?;
        main.set_focus().map_err(|e| e.to_string())?;
    }
    if let Some(splash) = app.get_webview_window("splash") {
        splash.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
