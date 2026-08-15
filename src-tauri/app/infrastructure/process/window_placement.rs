//! Best-effort placement of the spawned Minecraft window onto a specific
//! monitor. Minecraft has no `--monitor`/`--x`/`--y` launch argument, so this
//! is the only way to influence which display it opens on: poll for the
//! game's top-level window by process id after spawn, then move it there
//! with `SetWindowPos`. Purely cosmetic — a miss (window never appears in
//! time, monitor got unplugged) must never affect the launch itself, so this
//! never returns anything the caller has to check.

#[cfg(target_os = "windows")]
pub fn place_window_on_monitor(pid: u32, monitor_device_name: String) {
    log::info!(
        "window_placement: watching pid {pid} to move it onto monitor '{monitor_device_name}'"
    );
    std::thread::spawn(move || win32::place_window_on_monitor(pid, &monitor_device_name));
}

#[cfg(not(target_os = "windows"))]
pub fn place_window_on_monitor(_pid: u32, _monitor_device_name: String) {}

#[cfg(target_os = "windows")]
mod win32 {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use std::time::Duration;

    use windows::core::BOOL;
    use windows::Win32::Foundation::{HWND, LPARAM, RECT};
    use windows::Win32::Graphics::Gdi::{
        EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFOEXW,
    };
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindow, GetWindowThreadProcessId, IsWindowVisible, SetWindowPos, GW_OWNER,
        HWND_TOP, SWP_NOACTIVATE, SWP_NOSIZE, SWP_NOZORDER,
    };

    /// Polls for up to ~30s (JVM startup plus mod/asset loading before the
    /// window appears can take a while on heavier instances) for a visible,
    /// ownerless top-level window belonging to `pid`, then moves it to the
    /// top-left corner of `monitor_device_name`.
    pub fn place_window_on_monitor(pid: u32, monitor_device_name: &str) {
        let Some((x, y)) = monitor_origin(monitor_device_name) else {
            log::warn!(
                "window_placement: monitor '{monitor_device_name}' not found (unplugged or renamed?), skipping"
            );
            return;
        };

        const ATTEMPTS: u32 = 120;
        const INTERVAL: Duration = Duration::from_millis(250);
        for attempt in 0..ATTEMPTS {
            if let Some(hwnd) = find_top_level_window(pid) {
                let result = unsafe {
                    SetWindowPos(
                        hwnd,
                        Some(HWND_TOP),
                        x,
                        y,
                        0,
                        0,
                        SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE,
                    )
                };
                match result {
                    Ok(()) => log::info!(
                        "window_placement: moved pid {pid} window to monitor '{monitor_device_name}' ({x}, {y}) after {attempt} attempt(s)"
                    ),
                    Err(err) => {
                        log::warn!("window_placement: SetWindowPos failed for pid {pid}: {err}")
                    }
                }
                return;
            }
            std::thread::sleep(INTERVAL);
        }
        log::warn!(
            "window_placement: no window found for pid {pid} after {} attempts, giving up",
            ATTEMPTS
        );
    }

    struct MonitorSearch<'a> {
        device_name: &'a str,
        found: Option<(i32, i32)>,
    }

    fn monitor_origin(device_name: &str) -> Option<(i32, i32)> {
        unsafe extern "system" fn callback(
            monitor: HMONITOR,
            _hdc: HDC,
            _rect: *mut RECT,
            lparam: LPARAM,
        ) -> BOOL {
            let search = unsafe { &mut *(lparam.0 as *mut MonitorSearch) };
            let mut info = MONITORINFOEXW::default();
            info.monitorInfo.cbSize = std::mem::size_of::<MONITORINFOEXW>() as u32;
            let ok = unsafe { GetMonitorInfoW(monitor, &mut info.monitorInfo) };
            if ok.as_bool() {
                let len = info.szDevice.iter().position(|&c| c == 0).unwrap_or(0);
                let name = OsString::from_wide(&info.szDevice[..len])
                    .to_string_lossy()
                    .to_string();
                if name == search.device_name {
                    search.found = Some((
                        info.monitorInfo.rcMonitor.left,
                        info.monitorInfo.rcMonitor.top,
                    ));
                    return BOOL(0);
                }
            }
            BOOL(1)
        }

        let mut search = MonitorSearch {
            device_name,
            found: None,
        };
        unsafe {
            let _ = EnumDisplayMonitors(
                None,
                None,
                Some(callback),
                LPARAM(std::ptr::addr_of_mut!(search) as isize),
            );
        }
        search.found
    }

    struct WindowSearch {
        pid: u32,
        found: Option<HWND>,
    }

    fn find_top_level_window(pid: u32) -> Option<HWND> {
        unsafe extern "system" fn callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
            let search = unsafe { &mut *(lparam.0 as *mut WindowSearch) };
            let mut window_pid = 0u32;
            unsafe { GetWindowThreadProcessId(hwnd, Some(&mut window_pid)) };
            if window_pid != search.pid {
                return BOOL(1);
            }
            let visible = unsafe { IsWindowVisible(hwnd) }.as_bool();
            let has_owner = unsafe { GetWindow(hwnd, GW_OWNER) }.is_ok();
            if visible && !has_owner {
                search.found = Some(hwnd);
                return BOOL(0);
            }
            BOOL(1)
        }

        let mut search = WindowSearch { pid, found: None };
        unsafe {
            let _ = EnumWindows(
                Some(callback),
                LPARAM(std::ptr::addr_of_mut!(search) as isize),
            );
        }
        search.found
    }
}
