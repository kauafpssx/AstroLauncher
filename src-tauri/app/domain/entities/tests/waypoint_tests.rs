use super::*;

fn is_uuid_v4(value: &str) -> bool {
    match uuid::Uuid::parse_str(value) {
        Ok(parsed) => parsed.get_version_num() == 4,
        Err(_) => false,
    }
}

#[test]
fn new_copies_constructor_arguments() {
    let waypoint = Waypoint::new(
        "instance-1".to_string(),
        "Home".to_string(),
        "house".to_string(),
        "overworld".to_string(),
        10,
        Some(64),
        20,
    );

    assert_eq!(waypoint.instance_id, "instance-1");
    assert_eq!(waypoint.name, "Home");
    assert_eq!(waypoint.icon, "house");
    assert_eq!(waypoint.dimension, "overworld");
    assert_eq!(waypoint.x, 10);
    assert_eq!(waypoint.y, Some(64));
    assert_eq!(waypoint.z, 20);
}

#[test]
fn new_generates_v4_id_and_rfc3339_timestamp() {
    let waypoint = Waypoint::new(
        "instance-1".to_string(),
        "Base".to_string(),
        "base".to_string(),
        "nether".to_string(),
        -12,
        None,
        4,
    );

    assert!(is_uuid_v4(&waypoint.id));
    assert!(chrono::DateTime::parse_from_rfc3339(&waypoint.created_at).is_ok());
}
