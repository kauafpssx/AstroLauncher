use std::sync::Arc;

use parking_lot::Mutex;
use rusqlite::{params, Connection, OptionalExtension, Row};

use crate::domain::entities::Waypoint;
use crate::domain::errors::WaypointError;
use crate::domain::repositories::{WaypointRepository, WaypointResult as Result};

pub struct SqliteWaypointRepository {
    conn: Arc<Mutex<Connection>>,
}

impl SqliteWaypointRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }
}

const SELECT_COLUMNS: &str = "id, instance_id, name, icon, dimension, x, y, z, created_at";

fn map_row(row: &Row) -> rusqlite::Result<Waypoint> {
    Ok(Waypoint {
        id: row.get("id")?,
        instance_id: row.get("instance_id")?,
        name: row.get("name")?,
        icon: row.get("icon")?,
        dimension: row.get("dimension")?,
        x: row.get("x")?,
        y: row.get("y")?,
        z: row.get("z")?,
        created_at: row.get("created_at")?,
    })
}

impl WaypointRepository for SqliteWaypointRepository {
    fn find_by_instance(&self, instance_id: &str) -> Result<Vec<Waypoint>> {
        let conn = self.conn.lock();
        let sql = format!(
            "SELECT {SELECT_COLUMNS} FROM waypoints WHERE instance_id = ?1 ORDER BY created_at"
        );
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| WaypointError::Persistence(e.to_string()))?;
        let rows = stmt
            .query_map(params![instance_id], map_row)
            .map_err(|e| WaypointError::Persistence(e.to_string()))?;

        let mut waypoints = Vec::new();
        for row in rows {
            waypoints.push(row.map_err(|e| WaypointError::Persistence(e.to_string()))?);
        }
        Ok(waypoints)
    }

    fn find_by_id(&self, id: &str) -> Result<Waypoint> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM waypoints WHERE id = ?1");
        conn.query_row(&sql, params![id], map_row)
            .optional()
            .map_err(|e| WaypointError::Persistence(e.to_string()))?
            .ok_or_else(|| WaypointError::NotFound(id.to_string()))
    }

    fn save(&self, waypoint: &Waypoint) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO waypoints (id, instance_id, name, icon, dimension, x, y, z, created_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                waypoint.id,
                waypoint.instance_id,
                waypoint.name,
                waypoint.icon,
                waypoint.dimension,
                waypoint.x,
                waypoint.y,
                waypoint.z,
                waypoint.created_at,
            ],
        )
        .map_err(|e| WaypointError::Persistence(e.to_string()))?;
        Ok(())
    }

    fn update(&self, waypoint: &Waypoint) -> Result<()> {
        let conn = self.conn.lock();
        let affected = conn
            .execute(
                "UPDATE waypoints SET instance_id = ?1, name = ?2, icon = ?3, dimension = ?4, \
                 x = ?5, y = ?6, z = ?7 WHERE id = ?8",
                params![
                    waypoint.instance_id,
                    waypoint.name,
                    waypoint.icon,
                    waypoint.dimension,
                    waypoint.x,
                    waypoint.y,
                    waypoint.z,
                    waypoint.id,
                ],
            )
            .map_err(|e| WaypointError::Persistence(e.to_string()))?;
        if affected == 0 {
            return Err(WaypointError::NotFound(waypoint.id.clone()));
        }
        Ok(())
    }

    fn delete(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        let affected = conn
            .execute("DELETE FROM waypoints WHERE id = ?1", params![id])
            .map_err(|e| WaypointError::Persistence(e.to_string()))?;
        if affected == 0 {
            return Err(WaypointError::NotFound(id.to_string()));
        }
        Ok(())
    }
}
