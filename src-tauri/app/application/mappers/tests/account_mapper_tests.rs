use super::*;

#[test]
fn to_dto_copies_every_field() {
    let mut account = Account::new_offline("Steve".to_string(), 2);
    account.is_default = true;
    account.last_used = Some("2024-01-01T00:00:00Z".to_string());

    let dto = to_dto(&account);

    assert_eq!(dto.id, account.id);
    assert_eq!(dto.username, account.username);
    assert_eq!(dto.account_type, account.account_type);
    assert_eq!(dto.uuid, account.uuid);
    assert_eq!(dto.position, account.position);
    assert_eq!(dto.is_default, account.is_default);
    assert_eq!(dto.last_used, account.last_used);
    assert_eq!(dto.created_at, account.created_at);
}
