use super::*;

#[test]
fn new_sets_domain_defaults() {
    let instance = Instance::new("My Pack".to_string(), "1.20.1".to_string());

    assert_eq!(instance.name, "My Pack");
    assert_eq!(instance.version, "1.20.1");
    assert_eq!(instance.loader, None);
    assert_eq!(instance.loader_version, None);
    assert_eq!(instance.icon_path, None);
    assert_eq!(instance.java_args, None);
    assert_eq!(instance.min_memory, 2048);
    assert_eq!(instance.max_memory, 4096);
    assert_eq!(instance.folder_id, None);
    assert_eq!(instance.position, 0);
    assert_eq!(instance.last_played, None);
    assert_eq!(instance.playtime_seconds, 0);
}

#[test]
fn new_created_at_is_rfc3339() {
    let instance = Instance::new("Pack".to_string(), "1.20.1".to_string());

    assert!(chrono::DateTime::parse_from_rfc3339(&instance.created_at).is_ok());
}

#[test]
fn new_generates_unique_v4_ids() {
    let first = Instance::new("A".to_string(), "1.0".to_string());
    let second = Instance::new("A".to_string(), "1.0".to_string());

    let parsed = uuid::Uuid::parse_str(&first.id).expect("id should be a valid uuid");
    assert_eq!(parsed.get_version_num(), 4);
    assert_ne!(first.id, second.id);
}
