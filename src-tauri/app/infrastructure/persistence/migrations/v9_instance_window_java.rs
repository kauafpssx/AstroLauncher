use rusqlite::{Connection, Result};

pub const VERSION: u32 = 9;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        ALTER TABLE instances ADD COLUMN fullscreen INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE instances ADD COLUMN window_width INTEGER;
        ALTER TABLE instances ADD COLUMN window_height INTEGER;
        ALTER TABLE instances ADD COLUMN java_path TEXT;
        ",
    )
}
