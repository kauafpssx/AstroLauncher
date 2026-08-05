use super::*;

#[test]
fn new_sets_domain_defaults() {
    let session = PlaytimeSession::new("instance-9".to_string());

    assert_eq!(session.instance_id, "instance-9");
    assert_eq!(session.ended_at, None);
    assert_eq!(session.duration_seconds, 0);
}

#[test]
fn new_started_at_is_rfc3339() {
    let session = PlaytimeSession::new("instance-9".to_string());

    assert!(chrono::DateTime::parse_from_rfc3339(&session.started_at).is_ok());
}

#[test]
fn new_generates_unique_v4_ids() {
    let first = PlaytimeSession::new("i".to_string());
    let second = PlaytimeSession::new("i".to_string());

    let parsed = uuid::Uuid::parse_str(&first.id).expect("id should be a valid uuid");
    assert_eq!(parsed.get_version_num(), 4);
    assert_ne!(first.id, second.id);
}
