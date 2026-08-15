use std::path::Path;

/// Upserts a single `key:value` line in `options.txt`: replaces the
/// existing line for `key` if present, appends one if not, and creates the
/// file (and instance directory) if neither exists yet.
///
/// This is the only real way to control fullscreen — Minecraft has no
/// `--fullscreen` launch argument (confirmed against `mc-launcher-core`,
/// which mirrors Mojang's actual version-JSON argument set: no such
/// placeholder exists there). The client reads `fullscreen:true/false` from
/// this file at startup instead. Best-effort: a read/write failure must
/// never block the launch.
pub fn set_option(instance_dir: &Path, key: &str, value: &str) {
    let options_path = instance_dir.join("options.txt");
    let existing = std::fs::read_to_string(&options_path).unwrap_or_default();

    let prefix = format!("{key}:");
    let mut found = false;
    let mut lines: Vec<String> = existing
        .lines()
        .map(|line| {
            if line.starts_with(&prefix) {
                found = true;
                format!("{key}:{value}")
            } else {
                line.to_string()
            }
        })
        .collect();
    if !found {
        lines.push(format!("{key}:{value}"));
    }

    if std::fs::create_dir_all(instance_dir).is_err() {
        return;
    }
    let _ = std::fs::write(&options_path, lines.join("\n") + "\n");
}
