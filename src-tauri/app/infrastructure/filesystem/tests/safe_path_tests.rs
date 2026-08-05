use super::*;

fn base() -> PathBuf {
    PathBuf::from("/data/instances/abc")
}

#[test]
fn joins_normal_relative_path() {
    let joined = safe_join(&base(), "saves/world/level.dat").unwrap();
    assert_eq!(joined, base().join("saves").join("world").join("level.dat"));
}

#[test]
fn rejects_parent_traversal() {
    assert!(safe_join(&base(), "../../etc/passwd").is_none());
    assert!(safe_join(&base(), "saves/../../outside.txt").is_none());
}

#[test]
fn rejects_absolute_and_drive_paths() {
    assert!(safe_join(&base(), "/etc/passwd").is_none());
    // Backslash + drive letter (Windows) must not escape either.
    assert!(safe_join(&base(), "C:\\Windows\\system32").is_none());
}

#[test]
fn rejects_empty_relative() {
    assert!(safe_join(&base(), "").is_none());
}
