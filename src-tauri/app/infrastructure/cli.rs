use once_cell::sync::Lazy;
use parking_lot::Mutex;

const LAUNCH_FLAG: &str = "--launch-instance";

static PENDING_LAUNCH_INSTANCE: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));
static PENDING_ASTROPACK_PATH: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

/// Extracts the id following `--launch-instance` out of a process argument
/// list. Shared by the cold-start capture below and the single-instance
/// plugin callback (a second launch while the app is already running).
pub fn parse_launch_instance_arg<S: AsRef<str>>(args: &[S]) -> Option<String> {
    let mut iter = args.iter().map(AsRef::as_ref);
    while let Some(arg) = iter.next() {
        if arg == LAUNCH_FLAG {
            return iter.next().map(|id| id.to_string());
        }
    }
    None
}

/// Finds a plain `.astropack` file path in a process argument list: how
/// Windows passes the double-clicked file when it launches us through the
/// `.astropack` file association (registered via `bundle.fileAssociations`
/// in `tauri.conf.json`), as opposed to the `--launch-instance` flag a
/// desktop shortcut uses.
pub fn parse_astropack_path_arg<S: AsRef<str>>(args: &[S]) -> Option<String> {
    args.iter()
        .map(AsRef::as_ref)
        .find(|arg| arg.to_lowercase().ends_with(".astropack"))
        .map(|arg| arg.to_string())
}

/// Captures a `--launch-instance <id>` or `.astropack` file path from the
/// process arguments when the app was opened through a desktop shortcut or
/// the `.astropack` file association. Called once during setup.
pub fn init() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if let Some(id) = parse_launch_instance_arg(&args) {
        *PENDING_LAUNCH_INSTANCE.lock() = Some(id);
    } else if let Some(path) = parse_astropack_path_arg(&args) {
        *PENDING_ASTROPACK_PATH.lock() = Some(path);
    }
}

/// Returns and clears the instance a shortcut asked us to launch. Consumed by
/// the frontend once, right after startup.
pub fn take_pending_launch() -> Option<String> {
    PENDING_LAUNCH_INSTANCE.lock().take()
}

/// Returns and clears the `.astropack` file path opened via file association.
/// Consumed by the frontend once, right after startup.
pub fn take_pending_astropack_path() -> Option<String> {
    PENDING_ASTROPACK_PATH.lock().take()
}
