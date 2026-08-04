use std::sync::Arc;

use parking_lot::Mutex;
use rusqlite::{params, Connection, Row};

use crate::domain::entities::InstalledMod;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::{ModRepository, Result};

pub struct SqliteModRepository {
    conn: Arc<Mutex<Connection>>,
}

impl SqliteModRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }
}

const SELECT_COLUMNS: &str = "id, instance_id, mod_id, source, name, version, file_path, icon_url, kind, enabled, installed_at";

fn map_row(row: &Row) -> rusqlite::Result<InstalledMod> {
    Ok(InstalledMod {
        id: row.get("id")?,
        instance_id: row.get("instance_id")?,
        mod_id: row.get("mod_id")?,
        source: row.get("source")?,
        name: row.get("name")?,
        version: row.get("version")?,
        file_path: row.get("file_path")?,
        icon_url: row.get("icon_url")?,
        kind: row.get("kind")?,
        enabled: row.get::<_, i64>("enabled")? != 0,
        installed_at: row.get("installed_at")?,
    })
}

impl ModRepository for SqliteModRepository {
    fn find_by_instance(&self, instance_id: &str) -> Result<Vec<InstalledMod>> {
        let conn = self.conn.lock();
        let sql = format!(
            "SELECT {SELECT_COLUMNS} FROM instance_mods WHERE instance_id = ?1 ORDER BY name"
        );
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let rows = stmt
            .query_map(params![instance_id], map_row)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;

        let mut mods = Vec::new();
        for row in rows {
            mods.push(row.map_err(|e| InstanceError::Persistence(e.to_string()))?);
        }
        Ok(mods)
    }

    fn find_by_instance_and_kind(
        &self,
        instance_id: &str,
        kind: &str,
    ) -> Result<Vec<InstalledMod>> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM instance_mods WHERE instance_id = ?1 AND kind = ?2 ORDER BY name");
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let rows = stmt
            .query_map(params![instance_id, kind], map_row)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;

        let mut mods = Vec::new();
        for row in rows {
            mods.push(row.map_err(|e| InstanceError::Persistence(e.to_string()))?);
        }
        Ok(mods)
    }

    fn save(&self, installed_mod: &InstalledMod) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO instance_mods (id, instance_id, mod_id, source, name, version, file_path, icon_url, kind, enabled, installed_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11) \
             ON CONFLICT(id) DO UPDATE SET \
             name = excluded.name, version = excluded.version, file_path = excluded.file_path, \
             icon_url = excluded.icon_url, enabled = excluded.enabled",
            params![
                installed_mod.id,
                installed_mod.instance_id,
                installed_mod.mod_id,
                installed_mod.source,
                installed_mod.name,
                installed_mod.version,
                installed_mod.file_path,
                installed_mod.icon_url,
                installed_mod.kind,
                installed_mod.enabled as i64,
                installed_mod.installed_at,
            ],
        )
        .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }

    fn delete(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM instance_mods WHERE id = ?1", params![id])
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }

    fn set_enabled(&self, id: &str, enabled: bool) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE instance_mods SET enabled = ?1 WHERE id = ?2",
            params![enabled as i64, id],
        )
        .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }
}
