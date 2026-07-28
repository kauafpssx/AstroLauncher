use rusqlite::{Connection, Result};

pub const VERSION: u32 = 1;

pub fn up(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS instances (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            version     TEXT NOT NULL,
            loader      TEXT,
            loader_version TEXT,
            icon_path   TEXT,
            java_args   TEXT,
            min_memory  INTEGER DEFAULT 2048,
            max_memory  INTEGER DEFAULT 4096,
            folder_id   TEXT REFERENCES folders(id) ON DELETE SET NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            last_played TEXT,
            playtime_seconds INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS folders (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            position    INTEGER NOT NULL DEFAULT 0,
            collapsed   INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS playtime_sessions (
            id          TEXT PRIMARY KEY,
            instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
            started_at  TEXT NOT NULL,
            ended_at    TEXT,
            duration_seconds INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_playtime_instance ON playtime_sessions(instance_id);
        CREATE INDEX IF NOT EXISTS idx_playtime_started ON playtime_sessions(started_at);

        CREATE TABLE IF NOT EXISTS accounts (
            id          TEXT PRIMARY KEY,
            username    TEXT NOT NULL,
            type        TEXT NOT NULL DEFAULT 'offline',
            uuid        TEXT,
            last_used   TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS instance_mods (
            id          TEXT PRIMARY KEY,
            instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
            mod_id      TEXT NOT NULL,
            source      TEXT NOT NULL,
            name        TEXT NOT NULL,
            version     TEXT NOT NULL,
            file_path   TEXT NOT NULL,
            enabled     INTEGER NOT NULL DEFAULT 1,
            installed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_mods_instance ON instance_mods(instance_id);

        CREATE TABLE IF NOT EXISTS installed_modpacks (
            id          TEXT PRIMARY KEY,
            instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE UNIQUE,
            source      TEXT NOT NULL,
            project_id  TEXT NOT NULL,
            project_name TEXT NOT NULL,
            project_version TEXT NOT NULL,
            installed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS meta (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        ",
    )
}
