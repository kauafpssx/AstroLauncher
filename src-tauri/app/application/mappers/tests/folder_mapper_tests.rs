use super::*;

#[test]
fn to_dto_copies_every_field() {
    let mut folder = Folder::new("Mods".to_string(), 4);
    folder.collapsed = true;
    folder.icon_path = Some("icons/mods.png".to_string());

    let dto = to_dto(&folder);

    assert_eq!(dto.id, folder.id);
    assert_eq!(dto.name, folder.name);
    assert_eq!(dto.position, folder.position);
    assert_eq!(dto.collapsed, folder.collapsed);
    assert_eq!(dto.icon_path, folder.icon_path);
}
