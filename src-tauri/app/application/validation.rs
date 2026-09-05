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

pub fn validate_optional(value: Option<String>, max: usize) -> Result<Option<String>, String> {
    match value {
        Some(v) if v.chars().count() > max => Err(format!("must be at most {max} characters")),
        other => Ok(other),
    }
}
