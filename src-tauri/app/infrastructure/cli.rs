use once_cell::sync::Lazy;
use parking_lot::Mutex;

const LAUNCH_FLAG: &str = "--launch-instance";

static PENDING_LAUNCH_INSTANCE: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));
static PENDING_ASTROPACK_PATH: Lazy<Mutex<Option<String>>> = Lazy::new(|| Mutex::new(None));

pub fn parse_launch_instance_arg<S: AsRef<str>>(args: &[S]) -> Option<String> {
    let mut iter = args.iter().map(AsRef::as_ref);
    while let Some(arg) = iter.next() {
        if arg == LAUNCH_FLAG {
            return iter.next().map(|id| id.to_string());
        }
    }
    None
}

pub fn parse_astropack_path_arg<S: AsRef<str>>(args: &[S]) -> Option<String> {
    args.iter()
        .map(AsRef::as_ref)
        .find(|arg| arg.to_lowercase().ends_with(".astropack"))
        .map(|arg| arg.to_string())
}

pub fn init() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if let Some(id) = parse_launch_instance_arg(&args) {
        *PENDING_LAUNCH_INSTANCE.lock() = Some(id);
    } else if let Some(path) = parse_astropack_path_arg(&args) {
        *PENDING_ASTROPACK_PATH.lock() = Some(path);
    }
}

pub fn take_pending_launch() -> Option<String> {
    PENDING_LAUNCH_INSTANCE.lock().take()
}

pub fn take_pending_astropack_path() -> Option<String> {
    PENDING_ASTROPACK_PATH.lock().take()
}
