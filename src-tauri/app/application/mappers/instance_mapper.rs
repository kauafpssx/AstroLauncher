use crate::application::dto::InstanceDTO;
use crate::domain::entities::Instance;

pub fn to_dto(instance: &Instance) -> InstanceDTO {
    InstanceDTO {
        id: instance.id.clone(),
        name: instance.name.clone(),
        version: instance.version.clone(),
        loader: instance.loader.clone(),
        loader_version: instance.loader_version.clone(),
        icon_path: instance.icon_path.clone(),
        folder_id: instance.folder_id.clone(),
        java_args: instance.java_args.clone(),
        min_memory: instance.min_memory,
        max_memory: instance.max_memory,
        created_at: instance.created_at.clone(),
        last_played: instance.last_played.clone(),
        playtime_seconds: instance.playtime_seconds,
    }
}

#[cfg(test)]
#[path = "tests/instance_mapper_tests.rs"]
mod tests;
