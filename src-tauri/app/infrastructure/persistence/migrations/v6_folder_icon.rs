use rusqlite::{Connection, Result};

pub const VERSION: u32 = 6;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        ALTER TABLE folders ADD COLUMN icon_path TEXT;
        ",
    )
}
