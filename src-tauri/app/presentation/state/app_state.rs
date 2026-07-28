use std::path::PathBuf;
use std::sync::Arc;

use crate::application::use_cases::{
    AstroPackService, CreateAccountUseCase, CreateInstanceUseCase, DeleteAccountUseCase, DeleteInstanceUseCase,
    FetchVersionManifestUseCase, InstanceWorkspaceService, LaunchInstanceUseCase, ListAccountsUseCase, ListInstancesUseCase,
    ModBrowserService, ModManagerService, ModpackInstallerService, ReorderAccountsUseCase, SetDefaultAccountUseCase,
    SettingsService, StopInstanceUseCase, UpdateAccountUseCase, UpdateInstanceUseCase,
};
use crate::domain::repositories::{AccountRepository, InstanceRepository, ModRepository};
use crate::infrastructure::process::manager::ProcessManager;

pub struct AppState {
    pub list_instances: ListInstancesUseCase,
    pub create_instance: CreateInstanceUseCase,
    pub update_instance: UpdateInstanceUseCase,
    pub delete_instance: DeleteInstanceUseCase,
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
    pub settings: SettingsService,
    pub mod_browser: ModBrowserService,
    pub mod_manager: ModManagerService,
    pub modpack_installer: ModpackInstallerService,
    pub astropack: AstroPackService,
}

impl AppState {
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        account_repository: Arc<dyn AccountRepository>,
        mod_repository: Arc<dyn ModRepository>,
        http_client: reqwest::Client,
        app_data_dir: PathBuf,
    ) -> Self {
        let process_manager = ProcessManager::new();

        Self {
            list_instances: ListInstancesUseCase::new(instance_repository.clone()),
            create_instance: CreateInstanceUseCase::new(instance_repository.clone()),
            update_instance: UpdateInstanceUseCase::new(instance_repository.clone()),
            delete_instance: DeleteInstanceUseCase::new(
                instance_repository.clone(),
                process_manager.clone(),
                app_data_dir.clone(),
            ),
            instance_workspace: InstanceWorkspaceService::new(instance_repository.clone(), app_data_dir.clone()),
            settings: SettingsService::new(app_data_dir.clone()),
            mod_browser: ModBrowserService::new(http_client.clone(), app_data_dir.clone()),
            mod_manager: ModManagerService::new(mod_repository.clone(), http_client.clone(), app_data_dir.clone()),
            modpack_installer: ModpackInstallerService::new(instance_repository.clone(), http_client.clone(), app_data_dir.clone()),
            astropack: AstroPackService::new(instance_repository.clone(), mod_repository, http_client.clone(), app_data_dir.clone()),
            fetch_version_manifest: FetchVersionManifestUseCase::new(http_client.clone()),
            launch_instance: LaunchInstanceUseCase::new(
                instance_repository,
                account_repository.clone(),
                process_manager.clone(),
                http_client,
                app_data_dir,
            ),
            stop_instance: StopInstanceUseCase::new(process_manager),
            list_accounts: ListAccountsUseCase::new(account_repository.clone()),
            create_account: CreateAccountUseCase::new(account_repository.clone()),
            update_account: UpdateAccountUseCase::new(account_repository.clone()),
            delete_account: DeleteAccountUseCase::new(account_repository.clone()),
            set_default_account: SetDefaultAccountUseCase::new(account_repository.clone()),
            reorder_accounts: ReorderAccountsUseCase::new(account_repository),
        }
    }
}
