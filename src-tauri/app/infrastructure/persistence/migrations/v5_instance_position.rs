use rusqlite::{Connection, Result};

pub const VERSION: u32 = 5;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        ALTER TABLE instances ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
        ",
    )
}
