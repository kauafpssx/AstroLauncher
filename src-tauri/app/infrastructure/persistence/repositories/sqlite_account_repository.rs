use std::sync::Arc;

use parking_lot::Mutex;
use rusqlite::{params, Connection, OptionalExtension, Row};

use crate::domain::entities::Account;
use crate::domain::errors::AccountError;
use crate::domain::repositories::{AccountRepository, AccountResult as Result};

pub struct SqliteAccountRepository {
    conn: Arc<Mutex<Connection>>,
}

impl SqliteAccountRepository {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }
}

const SELECT_COLUMNS: &str =
    "id, username, type, uuid, position, is_default, last_used, created_at";

fn map_row(row: &Row) -> rusqlite::Result<Account> {
    Ok(Account {
        id: row.get("id")?,
        username: row.get("username")?,
        account_type: row.get("type")?,
        uuid: row.get("uuid")?,
        position: row.get("position")?,
        is_default: row.get::<_, i64>("is_default")? != 0,
        last_used: row.get("last_used")?,
        created_at: row.get("created_at")?,
    })
}

impl AccountRepository for SqliteAccountRepository {
    fn find_all(&self) -> Result<Vec<Account>> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM accounts ORDER BY position");
        let mut stmt = conn
            .prepare(&sql)
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        let rows = stmt
            .query_map([], map_row)
            .map_err(|e| AccountError::Persistence(e.to_string()))?;

        let mut accounts = Vec::new();
        for row in rows {
            accounts.push(row.map_err(|e| AccountError::Persistence(e.to_string()))?);
        }
        Ok(accounts)
    }

    fn find_by_id(&self, id: &str) -> Result<Account> {
        let conn = self.conn.lock();
        let sql = format!("SELECT {SELECT_COLUMNS} FROM accounts WHERE id = ?1");
        conn.query_row(&sql, params![id], map_row)
            .optional()
            .map_err(|e| AccountError::Persistence(e.to_string()))?
            .ok_or_else(|| AccountError::NotFound(id.to_string()))
    }

    fn save(&self, account: &Account) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO accounts (id, username, type, uuid, position, is_default, last_used, created_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) \
             ON CONFLICT(id) DO UPDATE SET \
             username = excluded.username, type = excluded.type, uuid = excluded.uuid, \
             position = excluded.position, is_default = excluded.is_default, last_used = excluded.last_used",
            params![
                account.id,
                account.username,
                account.account_type,
                account.uuid,
                account.position,
                account.is_default as i64,
                account.last_used,
                account.created_at,
            ],
        )
        .map_err(|e| AccountError::Persistence(e.to_string()))?;
        Ok(())
    }

    fn delete(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        let affected = conn
            .execute("DELETE FROM accounts WHERE id = ?1", params![id])
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        if affected == 0 {
            return Err(AccountError::NotFound(id.to_string()));
        }
        Ok(())
    }

    fn set_default(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        tx.execute("UPDATE accounts SET is_default = 0", [])
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        let affected = tx
            .execute(
                "UPDATE accounts SET is_default = 1 WHERE id = ?1",
                params![id],
            )
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        if affected == 0 {
            return Err(AccountError::NotFound(id.to_string()));
        }
        tx.commit()
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        Ok(())
    }

    fn reorder(&self, ordered_ids: &[String]) -> Result<()> {
        let conn = self.conn.lock();
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        for (index, id) in ordered_ids.iter().enumerate() {
            tx.execute(
                "UPDATE accounts SET position = ?1 WHERE id = ?2",
                params![index as i64, id],
            )
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        }
        tx.commit()
            .map_err(|e| AccountError::Persistence(e.to_string()))?;
        Ok(())
    }
}
