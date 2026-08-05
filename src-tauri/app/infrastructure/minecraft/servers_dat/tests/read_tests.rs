use super::*;

/// Writes `bytes` to a throwaway `servers.dat` and returns its path holder.
fn temp_servers(bytes: &[u8]) -> tempfile::TempDir {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("servers.dat"), bytes).unwrap();
    dir
}

/// Root `TAG_COMPOUND` + empty name, then a named tag with the given payload.
fn root_with_tag(tag: u8, payload: &[u8]) -> Vec<u8> {
    let mut b = vec![TAG_COMPOUND, 0x00, 0x00];
    b.push(tag);
    b.extend_from_slice(&[0x00, 0x01]); // name length 1
    b.push(b'x');
    b.extend_from_slice(payload);
    b
}

#[test]
fn rejects_non_empty_tag_end_list_without_hanging() {
    // TAG_LIST of TAG_END with i32::MAX elements would loop forever.
    let mut payload = vec![TAG_END];
    payload.extend_from_slice(&i32::MAX.to_be_bytes());
    let dir = temp_servers(&root_with_tag(TAG_LIST, &payload));
    assert!(read_servers(&dir.path().join("servers.dat")).is_err());
}

#[test]
fn rejects_negative_byte_array_length() {
    // len = -1 would become a multi-exabyte allocation.
    let dir = temp_servers(&root_with_tag(TAG_BYTE_ARRAY, &(-1i32).to_be_bytes()));
    assert!(read_servers(&dir.path().join("servers.dat")).is_err());
}
