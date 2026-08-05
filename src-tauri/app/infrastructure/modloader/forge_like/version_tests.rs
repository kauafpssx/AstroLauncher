use super::normalize_loader_version;

#[test]
fn forge_bare_version_gets_minecraft_prefix() {
    // Modrinth/CurseForge manifests store `47.4.10`; the Maven artifact
    // needs `1.20.1-47.4.10`.
    assert_eq!(
        normalize_loader_version("forge", "1.20.1", "47.4.10"),
        "1.20.1-47.4.10"
    );
}

#[test]
fn forge_already_prefixed_version_unchanged() {
    assert_eq!(
        normalize_loader_version("forge", "1.20.1", "1.20.1-47.4.10"),
        "1.20.1-47.4.10"
    );
}

#[test]
fn neoforge_standalone_version_unchanged() {
    assert_eq!(
        normalize_loader_version("neoforge", "1.20.1", "20.4.80"),
        "20.4.80"
    );
}
