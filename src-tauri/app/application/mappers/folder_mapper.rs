use crate::application::dto::FolderDTO;
use crate::domain::entities::Folder;

pub fn to_dto(folder: &Folder) -> FolderDTO {
    FolderDTO {
        id: folder.id.clone(),
        name: folder.name.clone(),
        position: folder.position,
        collapsed: folder.collapsed,
        icon_path: folder.icon_path.clone(),
    }
}

#[cfg(test)]
#[path = "tests/folder_mapper_tests.rs"]
mod tests;
