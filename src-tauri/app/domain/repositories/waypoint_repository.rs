use crate::domain::entities::Waypoint;
use crate::domain::errors::WaypointError;

pub type Result<T> = std::result::Result<T, WaypointError>;

pub trait WaypointRepository: Send + Sync {
    fn find_by_instance(&self, instance_id: &str) -> Result<Vec<Waypoint>>;
    fn find_by_id(&self, id: &str) -> Result<Waypoint>;
    fn save(&self, waypoint: &Waypoint) -> Result<()>;
    fn update(&self, waypoint: &Waypoint) -> Result<()>;
    fn delete(&self, id: &str) -> Result<()>;
}
