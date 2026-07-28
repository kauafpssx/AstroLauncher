use rusqlite::{Connection, Result};

pub const VERSION: u32 = 3;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch("ALTER TABLE instance_mods ADD COLUMN icon_url TEXT;")
}
