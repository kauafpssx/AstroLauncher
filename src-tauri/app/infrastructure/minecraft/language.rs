use std::path::Path;

/// Reads the OS-configured user locale (e.g. `pt-BR`, `en-US`) and maps it to
/// Minecraft's `lang:` option format (lowercase, underscore-separated).
#[cfg(target_os = "windows")]
fn detect_system_locale() -> Option<String> {
    use std::os::raw::c_int;

    extern "system" {
        fn GetUserDefaultLocaleName(locale_name: *mut u16, locale_name_len: c_int) -> c_int;
    }

    const LOCALE_NAME_MAX_LENGTH: usize = 85;
    let mut buffer = [0u16; LOCALE_NAME_MAX_LENGTH];
    let written = unsafe { GetUserDefaultLocaleName(buffer.as_mut_ptr(), buffer.len() as c_int) };
    if written <= 1 {
        return None;
    }
    let raw = String::from_utf16_lossy(&buffer[..(written as usize - 1)]);
    Some(raw.to_lowercase().replace('-', "_"))
}

#[cfg(not(target_os = "windows"))]
fn detect_system_locale() -> Option<String> {
    None
}

/// Seeds `options.txt` with the OS-configured language on first launch, so a
/// fresh instance (or one created from a modpack) opens Minecraft in the
/// user's system language instead of Mojang's `en_us` default. Never
/// overwrites an existing `options.txt`: respects whatever the user or the
/// modpack's overrides already set. Best-effort: a detection or write
/// failure must never block the launch.
pub fn ensure_default_language(instance_dir: &Path) {
    let options_path = instance_dir.join("options.txt");
    if options_path.exists() {
        return;
    }
    let Some(lang) = detect_system_locale() else {
        return;
    };
    if std::fs::create_dir_all(instance_dir).is_err() {
        return;
    }
    let _ = std::fs::write(&options_path, format!("lang:{lang}\n"));
}
