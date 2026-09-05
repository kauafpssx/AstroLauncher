use std::path::{Path, PathBuf};

pub fn safe_join(base: &Path, relative: &str) -> Option<PathBuf> {
    if relative.is_empty() {
        return None;
    }
    if relative.starts_with('/') || relative.starts_with('\\') {
        return None;
    }
    let mut out = base.to_path_buf();
    let mut pushed = false;
    for part in relative.split(['/', '\\']) {
        match part {
            "" | "." => continue,
            ".." => return None,
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
