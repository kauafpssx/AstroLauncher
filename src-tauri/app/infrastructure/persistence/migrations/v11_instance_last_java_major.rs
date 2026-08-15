use rusqlite::{Connection, Result};

pub const VERSION: u32 = 11;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        ALTER TABLE instances ADD COLUMN last_java_major INTEGER;
        ",
    )
}
