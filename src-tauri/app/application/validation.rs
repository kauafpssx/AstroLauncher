//! Shared validation for user-provided input.
//!
//! Mirrors the limits on the frontend (`src/lib/validation.ts` — `MAX`): the
//! UI caps typing via `maxLength`, and these checks close the loop so a
//! direct IPC call can't bypass the same limits. Keep both files in sync
//! when a limit changes.

pub const MAX_INSTANCE_NAME: usize = 60;
pub const MAX_ACCOUNT_USERNAME: usize = 16;
pub const MAX_FOLDER_NAME: usize = 50;
pub const MAX_NOTE_TITLE: usize = 40;
pub const MAX_SERVER_NAME: usize = 60;
pub const MAX_SERVER_IP: usize = 255;
pub const MAX_SCREENSHOT_NAME: usize = 60;
pub const MAX_MCSTAT_API_KEY: usize = 100;
pub const MAX_JAVA_ARGS: usize = 500;
pub const MAX_JAVA_PATH: usize = 500;
pub const MAX_ZEROTIER_API_TOKEN: usize = 100;
pub const MAX_ZEROTIER_NETWORK_ID: usize = 16;

/// Trims `value` and checks it is non-empty and within `max` characters.
/// Returns the trimmed value on success, or a short English description of
/// the problem on failure (prefixed by the domain error variant the caller
/// maps it into).
///
/// Counts Unicode scalar values, not UTF-16 units: for astral-plane text
/// (emoji) this is deliberately *more lenient* than the frontend's
/// `maxLength`/zod check. The UI is the strict gate; this only stops a
/// direct IPC call from bypassing it.
pub fn validate_required(value: &str, max: usize) -> Result<String, String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err("must not be empty".to_string());
    }
    if trimmed.chars().count() > max {
        return Err(format!("must be at most {max} characters"));
    }
    Ok(trimmed.to_string())
}

/// Checks an optional value is within `max` characters when present.
pub fn validate_optional(value: Option<String>, max: usize) -> Result<Option<String>, String> {
    match value {
        Some(v) if v.chars().count() > max => Err(format!("must be at most {max} characters")),
        other => Ok(other),
    }
}
