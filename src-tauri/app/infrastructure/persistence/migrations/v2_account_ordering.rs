use rusqlite::{Connection, Result};

pub const VERSION: u32 = 2;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        ALTER TABLE accounts ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE accounts ADD COLUMN is_default INTEGER NOT NULL DEFAULT 0;
        ",
    )
}
