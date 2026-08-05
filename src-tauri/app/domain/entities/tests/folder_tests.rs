use super::*;

#[test]
fn new_sets_domain_defaults() {
    let folder = Folder::new("Mods".to_string(), 5);

    assert_eq!(folder.name, "Mods");
    assert_eq!(folder.position, 5);
    assert!(!folder.collapsed);
    assert_eq!(folder.icon_path, None);
}

#[test]
fn new_generates_unique_v4_ids() {
    let first = Folder::new("A".to_string(), 0);
    let second = Folder::new("A".to_string(), 0);

    let parsed = uuid::Uuid::parse_str(&first.id).expect("id should be a valid uuid");
    assert_eq!(parsed.get_version_num(), 4);
    assert_ne!(first.id, second.id);
}
