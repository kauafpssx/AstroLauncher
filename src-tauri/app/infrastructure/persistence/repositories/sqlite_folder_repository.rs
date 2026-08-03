use std::sync::Arc;

use parking_lot::Mutex;
use rusqlite::{params, Connection, OptionalExtension, Row};

use crate::domain::entities::Folder;
use crate::domain::errors::FolderError;
use crate::domain::repositories::{FolderRepository, FolderResult as Result};

pub struct SqliteFolderRepository {
    conn: Arc<Mutex<Connection>>,
}

impl SqliteFolderRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }
}

const SELECT_COLUMNS: &str = "id, name, position, collapsed, icon_path";

fn map_row(row: &Row) -> rusqlite::Result<Folder> {
    Ok(Folder {
        id: row.get("id")?,
        name: row.get("name")?,
        position: row.get("position")?,
        collapsed: row.get::<_, i64>("collapsed")? != 0,
        icon_path: row.get("icon_path")?,
    })
}

impl FolderRepository for SqliteFolderRepository {
    fn find_all(&self) -> Result<Vec<Folder>> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM folders ORDER BY position, name");
        let mut stmt = conn.prepare(&sql).map_err(|e| FolderError::Persistence(e.to_string()))?;
        let rows = stmt.query_map([], map_row).map_err(|e| FolderError::Persistence(e.to_string()))?;

        let mut folders = Vec::new();
        for row in rows {
            folders.push(row.map_err(|e| FolderError::Persistence(e.to_string()))?);
        }
        Ok(folders)
    }

    fn find_by_id(&self, id: &str) -> Result<Folder> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM folders WHERE id = ?1");
        conn.query_row(&sql, params![id], map_row)
            .optional()
            .map_err(|e| FolderError::Persistence(e.to_string()))?
            .ok_or_else(|| FolderError::NotFound(id.to_string()))
    }

    fn save(&self, folder: &Folder) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO folders (id, name, position, collapsed, icon_path) VALUES (?1, ?2, ?3, ?4, ?5) \
             ON CONFLICT(id) DO UPDATE SET \
             name = excluded.name, position = excluded.position, collapsed = excluded.collapsed, icon_path = excluded.icon_path",
            params![
                folder.id,
                folder.name,
                folder.position,
                folder.collapsed as i64,
                folder.icon_path
            ],
        )
        .map_err(|e| FolderError::Persistence(e.to_string()))?;
        Ok(())
    }

    fn delete(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        let affected = conn
            .execute("DELETE FROM folders WHERE id = ?1", params![id])
            .map_err(|e| FolderError::Persistence(e.to_string()))?;
        if affected == 0 {
            return Err(FolderError::NotFound(id.to_string()));
        }
        Ok(())
    }

    fn reorder(&self, ordered_ids: &[String]) -> Result<()> {
        let conn = self.conn.lock();
        let tx = conn.unchecked_transaction().map_err(|e| FolderError::Persistence(e.to_string()))?;
        for (index, id) in ordered_ids.iter().enumerate() {
            tx.execute("UPDATE folders SET position = ?1 WHERE id = ?2", params![index as i64, id])
                .map_err(|e| FolderError::Persistence(e.to_string()))?;
        }
        tx.commit().map_err(|e| FolderError::Persistence(e.to_string()))?;
        Ok(())
    }
}
