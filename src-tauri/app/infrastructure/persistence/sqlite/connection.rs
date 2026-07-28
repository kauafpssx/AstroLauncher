use rusqlite::Connection;
use std::path::Path;

pub fn open(db_path: &Path) -> rusqlite::Result<Connection> {
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).expect("failed to create launcher data directory");
    }
    let conn = Connection::open(db_path)?;
    conn.pragma_update(None, "foreign_keys", true)?;
    Ok(conn)
}
