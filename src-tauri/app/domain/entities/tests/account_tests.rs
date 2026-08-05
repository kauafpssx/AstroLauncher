use super::*;

fn is_uuid_v4(value: &str) -> bool {
    match uuid::Uuid::parse_str(value) {
        Ok(parsed) => parsed.get_version_num() == 4,
        Err(_) => false,
    }
}

#[test]
fn new_offline_sets_domain_defaults() {
    let account = Account::new_offline("Steve".to_string(), 3);

    assert_eq!(account.username, "Steve");
    assert_eq!(account.position, 3);
    assert_eq!(account.account_type, "offline");
    assert!(!account.is_default);
    assert_eq!(account.last_used, None);
}

#[test]
fn new_offline_generates_distinct_v4_ids() {
    let account = Account::new_offline("Alex".to_string(), 0);

    assert!(is_uuid_v4(&account.id));
    assert!(is_uuid_v4(&account.uuid));
    assert_ne!(account.id, account.uuid);
}

#[test]
fn new_offline_created_at_is_rfc3339() {
    let account = Account::new_offline("Notch".to_string(), 0);

    assert!(chrono::DateTime::parse_from_rfc3339(&account.created_at).is_ok());
}

#[test]
fn new_offline_generates_unique_ids_per_call() {
    let first = Account::new_offline("A".to_string(), 0);
    let second = Account::new_offline("A".to_string(), 0);

    assert_ne!(first.id, second.id);
}
