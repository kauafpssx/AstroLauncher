use rusqlite::{Connection, Result};

pub const VERSION: u32 = 10;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        ALTER TABLE instances ADD COLUMN window_monitor TEXT;
        ",
    )
}
