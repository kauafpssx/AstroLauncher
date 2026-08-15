use rusqlite::{Connection, Result};

pub const VERSION: u32 = 8;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        ALTER TABLE accounts ADD COLUMN icon_path TEXT;
        ",
    )
}
