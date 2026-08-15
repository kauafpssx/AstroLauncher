use std::path::PathBuf;
use std::sync::Arc;

use crate::application::use_cases::{
    AstroPackService, CreateAccountUseCase, CreateFolderUseCase, CreateInstanceUseCase,
    CustomIconService, DeleteAccountUseCase, DeleteFolderUseCase, DeleteInstanceUseCase,
    DuplicateInstanceUseCase, FetchVersionManifestUseCase, InstanceWorkspaceService,
    LaunchInstanceUseCase, ListAccountsUseCase, ListFoldersUseCase, ListInstancesUseCase,
    ModBrowserService, ModManagerService, ModpackInstallerService, MoveInstanceToFolderUseCase,
    PlaytimeService, ReorderAccountsUseCase, ReorderFoldersUseCase, ReorderInstancesUseCase,
    SetDefaultAccountUseCase, SettingsService, SkinBrowserService, StopInstanceUseCase,
    SuggestMemoryUseCase, UpdateAccountUseCase, UpdateFolderUseCase, UpdateInstanceUseCase,
};
use crate::domain::repositories::{
    AccountRepository, FolderRepository, InstanceRepository, ModRepository, PlaytimeRepository,
};
use crate::infrastructure::discord::DiscordRpcHandle;
use crate::infrastructure::process::manager::ProcessManager;
use crate::infrastructure::zerotier::ZeroTierService;

pub struct AppState {
    pub list_instances: ListInstancesUseCase,
    pub create_instance: CreateInstanceUseCase,
    pub update_instance: UpdateInstanceUseCase,
    pub delete_instance: DeleteInstanceUseCase,
    pub duplicate_instance: DuplicateInstanceUseCase,
    pub move_instance_to_folder: MoveInstanceToFolderUseCase,
    pub reorder_instances: ReorderInstancesUseCase,
    pub instance_workspace: InstanceWorkspaceService,
    pub fetch_version_manifest: FetchVersionManifestUseCase,
    pub launch_instance: LaunchInstanceUseCase,
    pub stop_instance: StopInstanceUseCase,
    pub list_accounts: ListAccountsUseCase,
    pub create_account: CreateAccountUseCase,
    pub update_account: UpdateAccountUseCase,
    pub delete_account: DeleteAccountUseCase,
    pub set_default_account: SetDefaultAccountUseCase,
    pub reorder_accounts: ReorderAccountsUseCase,
    pub zerotier: ZeroTierService,
    pub list_folders: ListFoldersUseCase,
    pub create_folder: CreateFolderUseCase,
    pub update_folder: UpdateFolderUseCase,
    pub delete_folder: DeleteFolderUseCase,
    pub reorder_folders: ReorderFoldersUseCase,
    pub settings: SettingsService,
    pub mod_browser: ModBrowserService,
    pub mod_manager: ModManagerService,
    pub modpack_installer: ModpackInstallerService,
    pub suggest_memory: SuggestMemoryUseCase,
    pub astropack: AstroPackService,
    pub custom_icon: CustomIconService,
    pub skin_browser: SkinBrowserService,
    pub playtime: Arc<PlaytimeService>,
    pub discord: DiscordRpcHandle,
    pub app_data_dir: PathBuf,
}

impl AppState {
    // Dependency-injection constructor: many parameters are expected here.
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        account_repository: Arc<dyn AccountRepository>,
        folder_repository: Arc<dyn FolderRepository>,
        mod_repository: Arc<dyn ModRepository>,
        playtime_repository: Arc<dyn PlaytimeRepository>,
        http_client: reqwest::Client,
        app_data_dir: PathBuf,
        discord_client_id: String,
        discord_logo_asset_key: String,
    ) -> Self {
        let process_manager = ProcessManager::new();
        let playtime_service = Arc::new(PlaytimeService::new(
            instance_repository.clone(),
            playtime_repository,
        ));
        let zerotier_service = ZeroTierService::new(http_client.clone(), app_data_dir.clone());
        let discord = DiscordRpcHandle::spawn(discord_client_id, discord_logo_asset_key);
        discord.set_idle();

        Self {
            list_instances: ListInstancesUseCase::new(instance_repository.clone()),
            create_instance: CreateInstanceUseCase::new(instance_repository.clone()),
            update_instance: UpdateInstanceUseCase::new(instance_repository.clone()),
            delete_instance: DeleteInstanceUseCase::new(
                instance_repository.clone(),
                process_manager.clone(),
                app_data_dir.clone(),
            ),
            duplicate_instance: DuplicateInstanceUseCase::new(
                instance_repository.clone(),
                mod_repository.clone(),
                process_manager.clone(),
                app_data_dir.clone(),
            ),
            move_instance_to_folder: MoveInstanceToFolderUseCase::new(instance_repository.clone()),
            reorder_instances: ReorderInstancesUseCase::new(instance_repository.clone()),
            instance_workspace: InstanceWorkspaceService::new(
                instance_repository.clone(),
                app_data_dir.clone(),
            ),
            settings: SettingsService::new(app_data_dir.clone()),
            mod_browser: ModBrowserService::new(http_client.clone(), app_data_dir.clone()),
            mod_manager: ModManagerService::new(
                mod_repository.clone(),
                instance_repository.clone(),
                discord.clone(),
                http_client.clone(),
                app_data_dir.clone(),
            ),
            modpack_installer: ModpackInstallerService::new(
                instance_repository.clone(),
                mod_repository.clone(),
                discord.clone(),
                http_client.clone(),
                app_data_dir.clone(),
            ),
            suggest_memory: SuggestMemoryUseCase::new(mod_repository.clone()),
            astropack: AstroPackService::new(
                instance_repository.clone(),
                mod_repository.clone(),
                http_client.clone(),
                app_data_dir.clone(),
            ),
            custom_icon: CustomIconService::new(app_data_dir.clone()),
            skin_browser: SkinBrowserService::new(http_client.clone(), app_data_dir.clone()),
            fetch_version_manifest: FetchVersionManifestUseCase::new(http_client.clone()),
            app_data_dir: app_data_dir.clone(),
            launch_instance: LaunchInstanceUseCase::new(
                instance_repository,
                account_repository.clone(),
                mod_repository,
                playtime_service.clone(),
                discord.clone(),
                process_manager.clone(),
                http_client,
                app_data_dir,
            ),
            stop_instance: StopInstanceUseCase::new(process_manager),
            playtime: playtime_service,
            discord,
            list_accounts: ListAccountsUseCase::new(account_repository.clone()),
            create_account: CreateAccountUseCase::new(account_repository.clone()),
            update_account: UpdateAccountUseCase::new(account_repository.clone()),
            delete_account: DeleteAccountUseCase::new(account_repository.clone()),
            set_default_account: SetDefaultAccountUseCase::new(account_repository.clone()),
            reorder_accounts: ReorderAccountsUseCase::new(account_repository),
            zerotier: zerotier_service,
            list_folders: ListFoldersUseCase::new(folder_repository.clone()),
            create_folder: CreateFolderUseCase::new(folder_repository.clone()),
            update_folder: UpdateFolderUseCase::new(folder_repository.clone()),
            delete_folder: DeleteFolderUseCase::new(folder_repository.clone()),
            reorder_folders: ReorderFoldersUseCase::new(folder_repository),
        }
    }
}
