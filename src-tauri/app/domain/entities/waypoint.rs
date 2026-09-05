#[derive(Debug, Clone, PartialEq)]
pub struct Waypoint {
    pub id: String,
    pub instance_id: String,
    pub name: String,
    pub icon: String,
    pub dimension: String,
    pub x: i64,
    pub y: Option<i64>,
    pub z: i64,
    pub created_at: String,
}

impl Waypoint {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        instance_id: String,
        name: String,
        icon: String,
        dimension: String,
        x: i64,
        y: Option<i64>,
        z: i64,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            instance_id,
            name,
            icon,
            dimension,
            x,
            y,
            z,
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}

#[cfg(test)]
#[path = "tests/waypoint_tests.rs"]
mod tests;
