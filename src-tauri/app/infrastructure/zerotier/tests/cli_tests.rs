use super::*;

#[test]
fn parses_node_info() {
    let raw = r#"{"address":"deadbeef01","online":true,"version":"1.14.0"}"#;
    let info = parse_info(raw).unwrap();
    assert_eq!(info.address, "deadbeef01");
    assert!(info.online);
    assert_eq!(info.version, "1.14.0");
}

#[test]
fn parses_listnetworks() {
    let raw = r#"[{"id":"8056c2e21c000001","name":"my-net","status":"OK","mac":"aa:bb:cc:dd:ee:ff","assignedAddresses":["10.1.2.3/24"],"type":"PRIVATE","dhcp":true}]"#;
    let networks = parse_listnetworks(raw).unwrap();
    assert_eq!(networks.len(), 1);
    assert_eq!(networks[0].id, "8056c2e21c000001");
    assert_eq!(networks[0].status, LocalNetworkStatus::Ok);
    assert_eq!(networks[0].assigned_addresses, vec!["10.1.2.3/24"]);
}

#[test]
fn parses_join_success() {
    assert!(parse_join_leave_result("200 join OK").is_ok());
}

#[test]
fn parses_join_failure() {
    assert!(parse_join_leave_result("401 join Unauthorized").is_err());
}
