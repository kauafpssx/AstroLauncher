use std::sync::Arc;

use parking_lot::Mutex;

use crate::domain::repositories::{AccountRepository, FolderRepository, InstanceRepository, ModRepository, PlaytimeRepository};
use crate::infrastructure::persistence::migrations;
use crate::infrastructure::persistence::repositories::{
    SqliteAccountRepository, SqliteFolderRepository, SqliteInstanceRepository, SqliteModRepository, SqlitePlaytimeRepository,
};
use crate::infrastructure::persistence::sqlite::connection;
use crate::presentation::state::AppState;

pub fn build_app_state(app_data_dir: &std::path::Path, discord_client_id: String, discord_logo_asset_key: String) -> AppState {
    let db_path = app_data_dir.join("data").join("launcher.db");
    let conn = connection::open(&db_path).expect("failed to open launcher database");
    migrations::run(&conn).expect("failed to run database migrations");
    let conn = Arc::new(Mutex::new(conn));

    let instance_repository: Arc<dyn InstanceRepository> = Arc::new(SqliteInstanceRepository::new(conn.clone()));
    let account_repository: Arc<dyn AccountRepository> = Arc::new(SqliteAccountRepository::new(conn.clone()));
    let folder_repository: Arc<dyn FolderRepository> = Arc::new(SqliteFolderRepository::new(conn.clone()));
    let mod_repository: Arc<dyn ModRepository> = Arc::new(SqliteModRepository::new(conn.clone()));
    let playtime_repository: Arc<dyn PlaytimeRepository> = Arc::new(SqlitePlaytimeRepository::new(conn));
    let http_client = reqwest::Client::builder()
        .user_agent("AstroLauncher/0.1.0")
        .build()
        .expect("failed to build http client");

    AppState::new(
        instance_repository,
        account_repository,
        folder_repository,
        mod_repository,
        playtime_repository,
        http_client,
        app_data_dir.to_path_buf(),
        discord_client_id,
        discord_logo_asset_key,
    )
}
