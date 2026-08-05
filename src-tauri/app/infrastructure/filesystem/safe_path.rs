use std::path::{Component, Path, PathBuf};

/// Joins an untrusted `/`- or `\`-separated relative path onto `base`, keeping
/// the result inside `base`. Returns `None` for anything that could escape:
/// absolute paths, Windows drive prefixes (`C:\`), and `..` segments.
///
/// Untrusted input reaches here from imported packs (AstroPack/modpack ZIP
/// entry names, world/screenshot names) and the config editor — a `..` or an
/// absolute path would otherwise let `Path::join` write outside the instance.
pub fn safe_join(base: &Path, relative: &str) -> Option<PathBuf> {
    let mut out = base.to_path_buf();
    for component in Path::new(relative).components() {
        match component {
            Component::Normal(part) => out.push(part),
            // RootDir/Prefix = absolute; ParentDir = `..`; CurDir = `.`
            _ => return None,
        }
    }
    // Reject an empty relative that would resolve back to `base` itself.
    if out == base {
        return None;
    }
    Some(out)
}

#[cfg(test)]
#[path = "tests/safe_path_tests.rs"]
mod tests;
