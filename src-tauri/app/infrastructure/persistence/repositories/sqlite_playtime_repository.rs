use std::sync::Arc;

use parking_lot::Mutex;
use rusqlite::{params, Connection, OptionalExtension, Row};

use crate::domain::entities::PlaytimeSession;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::PlaytimeRepository;
use crate::domain::repositories::Result;

pub struct SqlitePlaytimeRepository {
    conn: Arc<Mutex<Connection>>,
}

impl SqlitePlaytimeRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }
}

const SELECT_COLUMNS: &str = "id, instance_id, started_at, ended_at, duration_seconds";

fn map_row(row: &Row) -> rusqlite::Result<PlaytimeSession> {
    Ok(PlaytimeSession {
        id: row.get("id")?,
        instance_id: row.get("instance_id")?,
        started_at: row.get("started_at")?,
        ended_at: row.get("ended_at")?,
        duration_seconds: row.get("duration_seconds")?,
    })
}

impl PlaytimeRepository for SqlitePlaytimeRepository {
    fn insert(&self, session: &PlaytimeSession) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO playtime_sessions (id, instance_id, started_at, ended_at, duration_seconds) \
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![
                session.id,
                session.instance_id,
                session.started_at,
                session.ended_at,
                session.duration_seconds,
            ],
        )
        .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(())
    }

    fn find_by_id(&self, id: &str) -> Result<Option<PlaytimeSession>> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM playtime_sessions WHERE id = ?1");
        conn.query_row(&sql, params![id], map_row)
            .optional()
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    fn find_latest_by_instance(&self, instance_id: &str) -> Result<Option<PlaytimeSession>> {
        let conn = self.conn.lock();
        let sql = format!(
            "SELECT {SELECT_COLUMNS} FROM playtime_sessions \
             WHERE instance_id = ?1 AND ended_at IS NOT NULL \
             ORDER BY ended_at DESC, rowid DESC LIMIT 1"
        );
        conn.query_row(&sql, params![instance_id], map_row)
            .optional()
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    fn find_open_by_instance(&self, instance_id: &str) -> Result<Option<PlaytimeSession>> {
        let conn = self.conn.lock();
        let sql = format!(
            "SELECT {SELECT_COLUMNS} FROM playtime_sessions \
             WHERE instance_id = ?1 AND ended_at IS NULL \
             ORDER BY rowid DESC LIMIT 1"
        );
        conn.query_row(&sql, params![instance_id], map_row)
            .optional()
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    fn update_end(&self, id: &str, ended_at: &str, duration_seconds: i64) -> Result<()> {
        let conn = self.conn.lock();
        let affected = conn
            .execute(
                "UPDATE playtime_sessions SET ended_at = ?1, duration_seconds = ?2 \
                 WHERE id = ?3 AND ended_at IS NULL",
                params![ended_at, duration_seconds, id],
            )
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        if affected == 0 {
            return Err(InstanceError::NotFound(id.to_string()));
        }
        Ok(())
    }
}
