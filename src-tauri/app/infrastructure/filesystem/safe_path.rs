use std::path::{Path, PathBuf};

/// Joins an untrusted `/`- or `\`-separated relative path onto `base`, keeping
/// the result inside `base`. Returns `None` for anything that could escape:
/// absolute paths, Windows drive prefixes (`C:\`), and `..` segments.
///
/// Untrusted input reaches here from imported packs (AstroPack/modpack ZIP
/// entry names, world/screenshot names) and the config editor — a `..` or an
/// absolute path would otherwise let `Path::join` write outside the instance.
///
/// Validation is done on the raw string (not `Path::components`, which is
/// OS-dependent) so `\` and `C:` are rejected on Linux/macOS too — the app
/// ships on Windows but the CI/tests run on Linux.
pub fn safe_join(base: &Path, relative: &str) -> Option<PathBuf> {
    if relative.is_empty() {
        return None;
    }
    // Absolute: unix root or a leading (back)slash.
    if relative.starts_with('/') || relative.starts_with('\\') {
        return None;
    }
    let mut out = base.to_path_buf();
    let mut pushed = false;
    for part in relative.split(['/', '\\']) {
        match part {
            // Collapse doubled separators (`a//b`) and no-op `.` segments.
            "" | "." => continue,
            ".." => return None,
            // Windows drive letter / alternate data stream (`C:`, `x:foo`).
            p if p.contains(':') => return None,
            p => {
                out.push(p);
                pushed = true;
            }
        }
    }
    if pushed {
        Some(out)
    } else {
        None
    }
}

#[cfg(test)]
#[path = "tests/safe_path_tests.rs"]
mod tests;
