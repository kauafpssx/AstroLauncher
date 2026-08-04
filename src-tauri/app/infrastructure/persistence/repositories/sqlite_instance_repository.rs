use std::sync::Arc;

use parking_lot::Mutex;
use rusqlite::{params, Connection, OptionalExtension, Row};

use crate::domain::entities::Instance;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::{InstanceRepository, Result};

pub struct SqliteInstanceRepository {
    conn: Arc<Mutex<Connection>>,
}

impl SqliteInstanceRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }
}

fn map_row(row: &Row) -> rusqlite::Result<Instance> {
    Ok(Instance {
        id: row.get("id")?,
        name: row.get("name")?,
        version: row.get("version")?,
        loader: row.get("loader")?,
        loader_version: row.get("loader_version")?,
        icon_path: row.get("icon_path")?,
        java_args: row.get("java_args")?,
        min_memory: row.get("min_memory")?,
        max_memory: row.get("max_memory")?,
        folder_id: row.get("folder_id")?,
        position: row.get("position")?,
        created_at: row.get("created_at")?,
        last_played: row.get("last_played")?,
        playtime_seconds: row.get("playtime_seconds")?,
    })
}

const SELECT_COLUMNS: &str = "id, name, version, loader, loader_version, icon_path, java_args, \
     min_memory, max_memory, folder_id, position, created_at, last_played, playtime_seconds";

impl InstanceRepository for SqliteInstanceRepository {
    fn find_all(&self) -> Result<Vec<Instance>> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM instances ORDER BY position, name");
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let rows = stmt
            .query_map([], map_row)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;

        let mut instances = Vec::new();
        for row in rows {
            instances.push(row.map_err(|e| InstanceError::Persistence(e.to_string()))?);
        }
        Ok(instances)
    }

    fn find_by_id(&self, id: &str) -> Result<Instance> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM instances WHERE id = ?1");
        conn.query_row(&sql, params![id], map_row)
            .optional()
            .map_err(|e| InstanceError::Persistence(e.to_string()))?
            .ok_or_else(|| InstanceError::NotFound(id.to_string()))
    }

    fn find_by_folder(&self, folder_id: &str) -> Result<Vec<Instance>> {
        let conn = self.conn.lock();
        let sql = format!(
            "SELECT {SELECT_COLUMNS} FROM instances WHERE folder_id = ?1 ORDER BY position, name"
        );
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let rows = stmt
            .query_map(params![folder_id], map_row)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;

        let mut instances = Vec::new();
        for row in rows {
            instances.push(row.map_err(|e| InstanceError::Persistence(e.to_string()))?);
        }
        Ok(instances)
    }

    fn save(&self, instance: &Instance) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO instances (id, name, version, loader, loader_version, icon_path, java_args, \
             min_memory, max_memory, folder_id, position, created_at, last_played, playtime_seconds) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14) \
             ON CONFLICT(id) DO UPDATE SET \
             name = excluded.name, version = excluded.version, loader = excluded.loader, \
             loader_version = excluded.loader_version, icon_path = excluded.icon_path, \
             java_args = excluded.java_args, min_memory = excluded.min_memory, \
             max_memory = excluded.max_memory, folder_id = excluded.folder_id, \
             position = excluded.position, last_played = excluded.last_played, \
             playtime_seconds = excluded.playtime_seconds",
            params![
                instance.id,
                instance.name,
                instance.version,
                instance.loader,
                instance.loader_version,
                instance.icon_path,
                instance.java_args,
                instance.min_memory,
                instance.max_memory,
                instance.folder_id,
                instance.position,
                instance.created_at,
                instance.last_played,
                instance.playtime_seconds,
            ],
        )
        .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }

    fn delete(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        let affected = conn
            .execute("DELETE FROM instances WHERE id = ?1", params![id])
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        if affected == 0 {
            return Err(InstanceError::NotFound(id.to_string()));
        }
        Ok(())
    }

    fn update_playtime(&self, id: &str, seconds: i64) -> Result<()> {
        let conn = self.conn.lock();
        let affected = conn
            .execute(
                "UPDATE instances SET playtime_seconds = ?1, last_played = datetime('now') WHERE id = ?2",
                params![seconds, id],
            )
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        if affected == 0 {
            return Err(InstanceError::NotFound(id.to_string()));
        }
        Ok(())
    }

    fn reorder(&self, ordered_ids: &[String]) -> Result<()> {
        let conn = self.conn.lock();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        for (index, id) in ordered_ids.iter().enumerate() {
            tx.execute(
                "UPDATE instances SET position = ?1 WHERE id = ?2",
                params![index as i64, id],
            )
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        }
        tx.commit()
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }
}
