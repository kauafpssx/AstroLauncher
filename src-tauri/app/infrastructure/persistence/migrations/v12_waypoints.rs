use rusqlite::{Connection, Result};

pub const VERSION: u32 = 12;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE waypoints (
            id          TEXT PRIMARY KEY,
            instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
            name        TEXT NOT NULL,
            icon        TEXT NOT NULL,
            dimension   TEXT NOT NULL DEFAULT 'overworld',
            x           INTEGER NOT NULL,
            y           INTEGER,
            z           INTEGER NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );
        ",
    )
}
