#[path = "../app/application/mod.rs"]
pub mod application;
#[path = "../app/bootstrap/mod.rs"]
pub mod bootstrap;
#[path = "../app/domain/mod.rs"]
pub mod domain;
#[path = "../app/infrastructure/mod.rs"]
pub mod infrastructure;
#[path = "../app/presentation/mod.rs"]
pub mod presentation;

use presentation::commands::{
  account_commands, astropack_commands, instance_commands, instance_workspace_commands, minecraft_commands, mod_commands,
  settings_commands, splash_commands,
};
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let app_data_dir = app.path().app_data_dir()?;
      let state = bootstrap::setup::build_app_state(&app_data_dir);
      app.manage(state);

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      instance_commands::list_instances,
      instance_commands::create_instance,
      instance_commands::update_instance,
      instance_commands::delete_instance,
      instance_workspace_commands::read_instance_log,
      instance_workspace_commands::read_instance_notes,
      instance_workspace_commands::write_instance_notes,
      instance_workspace_commands::open_instance_folder,
      instance_workspace_commands::list_instance_worlds,
      instance_workspace_commands::delete_instance_world,
      instance_workspace_commands::list_instance_servers,
      instance_workspace_commands::add_instance_server,
      instance_workspace_commands::update_instance_server,
      instance_workspace_commands::delete_instance_server,
      instance_workspace_commands::list_instance_screenshots,
      instance_workspace_commands::read_instance_screenshot,
      instance_workspace_commands::delete_instance_screenshot,
      instance_workspace_commands::save_instance_screenshot_as,
      instance_workspace_commands::rename_instance_screenshot,
      minecraft_commands::list_minecraft_versions,
      minecraft_commands::launch_instance,
      minecraft_commands::stop_instance,
      account_commands::list_accounts,
      account_commands::create_account,
      account_commands::update_account,
      account_commands::delete_account,
      account_commands::set_default_account,
      account_commands::reorder_accounts,
      settings_commands::get_settings,
      settings_commands::update_settings,
      mod_commands::search_mods,
      mod_commands::get_mod_versions,
      mod_commands::get_mod_project,
      mod_commands::install_mod,
      mod_commands::install_custom_mod,
      mod_commands::list_instance_mods,
      mod_commands::set_instance_mod_enabled,
      mod_commands::delete_instance_mod,
      mod_commands::install_modrinth_modpack,
      astropack_commands::preview_astropack,
      astropack_commands::get_astropack_export_summary,
      astropack_commands::export_instance,
      astropack_commands::import_astropack,
      splash_commands::finish_splash,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
