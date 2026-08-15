//! Best-effort "focus the existing Explorer window" for a folder, instead of
//! always spawning a new one. Windows Explorer has no CLI flag for this —
//! the only way in is the `Shell.Application` COM automation object (the
//! same one `(New-Object -ComObject Shell.Application).Windows()` uses in
//! PowerShell), enumerating open windows and matching by URL.
//!
//! Every step here is fallible by nature (COM server not running, a window
//! that isn't a filesystem folder, a cast that doesn't hold), and a miss
//! must never block the user from opening the folder — the caller always
//! has a plain `explorer.exe <path>` fallback for when this returns `false`.

#[cfg(target_os = "windows")]
pub fn focus_existing_window(dir: &std::path::Path) -> bool {
    win32::focus_existing_window(dir)
}

#[cfg(not(target_os = "windows"))]
pub fn focus_existing_window(_dir: &std::path::Path) -> bool {
    false
}

#[cfg(target_os = "windows")]
mod win32 {
    use std::path::{Path, PathBuf};

    use windows::core::{Interface, GUID};
    use windows::Win32::Foundation::HWND;
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_LOCAL_SERVER,
        COINIT_APARTMENTTHREADED,
    };
    use windows::Win32::System::Variant::{VARIANT, VARIANT_0, VARIANT_0_0, VT_I4};
    use windows::Win32::UI::Shell::{IShellWindows, IWebBrowserApp};
    use windows::Win32::UI::WindowsAndMessaging::{SetForegroundWindow, ShowWindow, SW_RESTORE};

    const CLSID_SHELL_WINDOWS: GUID = GUID::from_u128(0x9BA05972_F6A8_11CF_A442_00A0C90A8F39);

    pub fn focus_existing_window(dir: &Path) -> bool {
        // CoInitializeEx must run on the calling thread before any other COM
        // call; Tauri commands run on the async runtime's worker threads, a
        // fresh one each time, so this can't be hoisted out to run once.
        unsafe {
            if CoInitializeEx(None, COINIT_APARTMENTTHREADED).is_err() {
                return false;
            }
            let found = find_and_focus(dir);
            CoUninitialize();
            found
        }
    }

    unsafe fn find_and_focus(dir: &Path) -> bool {
        let shell_windows: IShellWindows =
            match unsafe { CoCreateInstance(&CLSID_SHELL_WINDOWS, None, CLSCTX_LOCAL_SERVER) } {
                Ok(sw) => sw,
                Err(_) => return false,
            };
        let count = match unsafe { shell_windows.Count() } {
            Ok(c) => c,
            Err(_) => return false,
        };

        for i in 0..count {
            let Ok(dispatch) = (unsafe { shell_windows.Item(&variant_i4(i)) }) else {
                continue;
            };
            let Ok(browser): windows::core::Result<IWebBrowserApp> = dispatch.cast() else {
                continue;
            };
            let Ok(url) = (unsafe { browser.LocationURL() }) else {
                continue;
            };
            let Some(path) = file_url_to_path(&url.to_string()) else {
                continue;
            };
            if !same_path(&path, dir) {
                continue;
            }
            let Ok(hwnd_ptr) = (unsafe { browser.HWND() }) else {
                continue;
            };
            let hwnd = HWND(hwnd_ptr.0 as _);
            unsafe {
                let _ = ShowWindow(hwnd, SW_RESTORE);
                let _ = SetForegroundWindow(hwnd);
            }
            return true;
        }
        false
    }

    fn variant_i4(value: i32) -> VARIANT {
        let mut inner: VARIANT_0_0 = unsafe { core::mem::zeroed() };
        inner.vt = VT_I4;
        inner.Anonymous.lVal = value;
        VARIANT {
            Anonymous: VARIANT_0 {
                Anonymous: core::mem::ManuallyDrop::new(inner),
            },
        }
    }

    /// `file:///C:/Users/name/Folder%20Name` -> `C:\Users\name\Folder Name`.
    /// Only handles the local-drive case (`file:///<drive>:/...`): Explorer
    /// windows showing non-filesystem locations (This PC, search results,
    /// network shares as `\\host\share`) don't match and are skipped.
    fn file_url_to_path(url: &str) -> Option<PathBuf> {
        let rest = url.strip_prefix("file:///")?;
        Some(PathBuf::from(percent_decode(rest).replace('/', "\\")))
    }

    fn percent_decode(s: &str) -> String {
        let bytes = s.as_bytes();
        let mut out = Vec::with_capacity(bytes.len());
        let mut i = 0;
        while i < bytes.len() {
            if bytes[i] == b'%' && i + 2 < bytes.len() {
                if let Ok(byte) = u8::from_str_radix(&s[i + 1..i + 3], 16) {
                    out.push(byte);
                    i += 3;
                    continue;
                }
            }
            out.push(bytes[i]);
            i += 1;
        }
        String::from_utf8_lossy(&out).into_owned()
    }

    fn same_path(a: &Path, b: &Path) -> bool {
        let norm = |p: &Path| {
            p.to_string_lossy()
                .trim_end_matches(['\\', '/'])
                .to_lowercase()
        };
        norm(a) == norm(b)
    }
}
