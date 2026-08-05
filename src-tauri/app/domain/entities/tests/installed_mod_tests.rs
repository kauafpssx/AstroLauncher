use super::*;

fn sample() -> InstalledMod {
    InstalledMod::new(
        "instance-1".to_string(),
        "sodium".to_string(),
        "modrinth".to_string(),
        "Sodium".to_string(),
        "0.5.3".to_string(),
        "mods/sodium.jar".to_string(),
        Some("https://cdn/icon.png".to_string()),
        "mod".to_string(),
    )
}

#[test]
fn new_copies_constructor_arguments() {
    let installed = sample();

    assert_eq!(installed.instance_id, "instance-1");
    assert_eq!(installed.mod_id, "sodium");
    assert_eq!(installed.source, "modrinth");
    assert_eq!(installed.name, "Sodium");
    assert_eq!(installed.version, "0.5.3");
    assert_eq!(installed.file_path, "mods/sodium.jar");
    assert_eq!(installed.icon_url.as_deref(), Some("https://cdn/icon.png"));
    assert_eq!(installed.kind, "mod");
}

#[test]
fn new_defaults_to_enabled_with_rfc3339_timestamp() {
    let installed = sample();

    assert!(installed.enabled);
    assert!(chrono::DateTime::parse_from_rfc3339(&installed.installed_at).is_ok());
}

#[test]
fn new_generates_unique_v4_ids() {
    let first = sample();
    let second = sample();

    let parsed = uuid::Uuid::parse_str(&first.id).expect("id should be a valid uuid");
    assert_eq!(parsed.get_version_num(), 4);
    assert_ne!(first.id, second.id);
}
