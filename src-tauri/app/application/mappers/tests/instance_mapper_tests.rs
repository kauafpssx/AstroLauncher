use super::*;

#[test]
fn to_dto_copies_every_dto_field() {
    let mut instance = Instance::new("My Pack".to_string(), "1.20.1".to_string());
    instance.loader = Some("fabric".to_string());
    instance.loader_version = Some("0.15.0".to_string());
    instance.icon_path = Some("icons/pack.png".to_string());
    instance.java_args = Some("-Xmx4G".to_string());
    instance.folder_id = Some("folder-1".to_string());
    instance.last_played = Some("2024-01-01T00:00:00Z".to_string());
    instance.playtime_seconds = 3600;
    instance.fullscreen = true;
    instance.window_width = Some(1920);
    instance.window_height = Some(1080);
    instance.java_path = Some("C:/Java/bin/java.exe".to_string());
    instance.window_monitor = Some("\\\\.\\DISPLAY2".to_string());
    instance.last_java_major = Some(21);

    let dto = to_dto(&instance);

    assert_eq!(dto.id, instance.id);
    assert_eq!(dto.name, instance.name);
    assert_eq!(dto.version, instance.version);
    assert_eq!(dto.loader, instance.loader);
    assert_eq!(dto.loader_version, instance.loader_version);
    assert_eq!(dto.icon_path, instance.icon_path);
    assert_eq!(dto.folder_id, instance.folder_id);
    assert_eq!(dto.java_args, instance.java_args);
    assert_eq!(dto.min_memory, instance.min_memory);
    assert_eq!(dto.max_memory, instance.max_memory);
    assert_eq!(dto.created_at, instance.created_at);
    assert_eq!(dto.last_played, instance.last_played);
    assert_eq!(dto.playtime_seconds, instance.playtime_seconds);
    assert_eq!(dto.fullscreen, instance.fullscreen);
    assert_eq!(dto.window_width, instance.window_width);
    assert_eq!(dto.window_height, instance.window_height);
    assert_eq!(dto.java_path, instance.java_path);
    assert_eq!(dto.window_monitor, instance.window_monitor);
    assert_eq!(dto.last_java_major, instance.last_java_major);
}
