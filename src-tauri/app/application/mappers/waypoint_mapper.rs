use crate::application::dto::WaypointDTO;
use crate::domain::entities::Waypoint;

pub fn to_dto(waypoint: &Waypoint) -> WaypointDTO {
    WaypointDTO {
        id: waypoint.id.clone(),
        instance_id: waypoint.instance_id.clone(),
        name: waypoint.name.clone(),
        icon: waypoint.icon.clone(),
        dimension: waypoint.dimension.clone(),
        x: waypoint.x,
        y: waypoint.y,
        z: waypoint.z,
        created_at: waypoint.created_at.clone(),
    }
}
