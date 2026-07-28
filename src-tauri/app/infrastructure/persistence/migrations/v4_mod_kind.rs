use rusqlite::{Connection, Result};

pub const VERSION: u32 = 4;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch("ALTER TABLE instance_mods ADD COLUMN kind TEXT NOT NULL DEFAULT 'mod';")
}
