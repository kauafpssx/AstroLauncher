mod v1_initial;
mod v2_account_ordering;
mod v3_mod_icon;
mod v4_mod_kind;

use rusqlite::{Connection, Result};

type MigrationFn = fn(&Connection) -> Result<()>;

const MIGRATIONS: &[(u32, MigrationFn)] = &[
    (v1_initial::VERSION, v1_initial::up),
    (v2_account_ordering::VERSION, v2_account_ordering::up),
    (v3_mod_icon::VERSION, v3_mod_icon::up),
    (v4_mod_kind::VERSION, v4_mod_kind::up),
];

pub fn run(conn: &Connection) -> Result<()> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);")?;

    let current: u32 = conn
        .query_row("SELECT value FROM meta WHERE key = 'schema_version'", [], |row| {
            let v: String = row.get(0)?;
            Ok(v.parse().unwrap_or(0))
        })
        .unwrap_or(0);

    for &(version, up) in MIGRATIONS {
        if current < version {
            let tx = conn.unchecked_transaction()?;
            up(&tx)?;
            tx.execute(
                "INSERT INTO meta (key, value) VALUES ('schema_version', ?1)
                 ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                [version.to_string()],
            )?;
            tx.commit()?;
        }
    }

    Ok(())
}
