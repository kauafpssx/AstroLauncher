use wiremock::matchers::{header, method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

use super::*;

#[tokio::test]
async fn list_members_sends_auth_header_and_parses_response() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/network/8056c2e21c000001/member"))
        .and(header("Authorization", "token test-token"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!([
            {
                "nodeId": "abc123",
                "name": "friend-pc",
                "config": { "authorized": false, "ipAssignments": [] }
            }
        ])))
        .mount(&server)
        .await;

    let client = reqwest::Client::new();
    let members = list_members(&client, &server.uri(), "test-token", "8056c2e21c000001")
        .await
        .unwrap();

    assert_eq!(members.len(), 1);
    assert_eq!(members[0].node_id, "abc123");
    assert!(!members[0].config.authorized);
}

#[tokio::test]
async fn set_member_authorized_sends_expected_body() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/network/8056c2e21c000001/member/abc123"))
        .and(header("Authorization", "token test-token"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({})))
        .mount(&server)
        .await;

    let client = reqwest::Client::new();
    set_member_authorized(
        &client,
        &server.uri(),
        "test-token",
        "8056c2e21c000001",
        "abc123",
        true,
    )
    .await
    .unwrap();
}

#[tokio::test]
async fn unauthorized_token_maps_to_friendly_error() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/network"))
        .respond_with(ResponseTemplate::new(401))
        .mount(&server)
        .await;

    let client = reqwest::Client::new();
    let err = list_owned_networks(&client, &server.uri(), "bad-token")
        .await
        .unwrap_err();
    assert!(err.to_string().contains("inválido"));
}
