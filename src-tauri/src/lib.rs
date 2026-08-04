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
    account_commands, astropack_commands, custom_icon_commands, discord_commands, folder_commands,
    instance_commands, instance_workspace_commands, minecraft_commands, mod_commands,
    playtime_commands, settings_commands, skin_commands, splash_commands,
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
            infrastructure::config::init(app.config());
            let discord_config = app
                .config()
                .plugins
                .0
                .get("discord")
                .cloned()
                .unwrap_or_default();
            let discord_client_id = discord_config
                .get("clientId")
                .and_then(|v| v.as_str())
                .expect("plugins.discord.clientId missing in tauri.conf.json")
                .to_string();
            let discord_logo_asset_key = discord_config
                .get("logoAssetKey")
                .and_then(|v| v.as_str())
                .expect("plugins.discord.logoAssetKey missing in tauri.conf.json")
                .to_string();
            let state = bootstrap::setup::build_app_state(
                &app_data_dir,
                discord_client_id,
                discord_logo_asset_key,
            );
            app.manage(state);

            if cfg!(debug_assertions) && std::env::var("ASTRO_DEV_NO_SPLASH").is_ok() {
                if let Some(splash) = app.get_webview_window("splash") {
                    splash.close()?;
                }
                if let Some(main) = app.get_webview_window("main") {
                    main.show()?;
                    main.set_focus()?;
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            instance_commands::list_instances,
            instance_commands::create_instance,
            instance_commands::update_instance,
            instance_commands::delete_instance,
            instance_commands::move_instance_to_folder,
            instance_commands::reorder_instances,
            folder_commands::list_folders,
            folder_commands::create_folder,
            folder_commands::update_folder,
            folder_commands::delete_folder,
            folder_commands::reorder_folders,
            instance_workspace_commands::read_instance_log,
            instance_workspace_commands::list_instance_notes,
            instance_workspace_commands::read_instance_note,
            instance_workspace_commands::write_instance_note,
            instance_workspace_commands::create_instance_note,
            instance_workspace_commands::rename_instance_note,
            instance_workspace_commands::delete_instance_note,
            instance_workspace_commands::list_instance_config_files,
            instance_workspace_commands::read_instance_config_file,
            instance_workspace_commands::write_instance_config_file,
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
            minecraft_commands::cancel_launch,
            discord_commands::discord_set_presence,
            minecraft_commands::get_total_system_memory_mb,
            minecraft_commands::list_audio_output_devices,
            playtime_commands::get_playtime_summary,
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
            mod_commands::install_curseforge_modpack,
            mod_commands::cancel_modpack_install,
            skin_commands::search_skins,
            skin_commands::get_skin,
            skin_commands::download_skin,
            skin_commands::fetch_skin_texture_base64,
            astropack_commands::preview_astropack,
            astropack_commands::get_astropack_export_summary,
            astropack_commands::export_instance,
            astropack_commands::import_astropack,
            custom_icon_commands::list_custom_icons,
            custom_icon_commands::save_custom_icon,
            custom_icon_commands::delete_custom_icon,
            splash_commands::finish_splash,
            infrastructure::config::get_app_env_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
