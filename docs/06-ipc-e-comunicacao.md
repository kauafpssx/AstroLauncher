# 06 — IPC e Comunicação Frontend/Backend

## 6.1 Organização dos Comandos Tauri

Comandos ficam em `src-tauri/app/presentation/commands/*_commands.rs`, um arquivo por domínio, registrados via `tauri::generate_handler![...]` em `src-tauri/src/lib.rs`.

| Arquivo | Comandos |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- || `instance_commands.rs` | `list_instances`, `create_instance`, `update_instance`, `delete_instance`, `duplicate_instance`, `move_instance_to_folder`, `reorder_instances` |
| `folder_commands.rs` | `list_folders`, `create_folder`, `update_folder`, `delete_folder`, `reorder_folders` |
| `instance_workspace_commands.rs` | 26 comandos: log, notas, arquivos de config, mundos, servers, screenshots, atalhos — ex.: `read_instance_log`, `list_instance_notes`, `write_instance_note`, `list_instance_config_files`, `write_instance_config_file`, `list_instance_worlds`, `delete_instance_world`, `list_instance_servers`, `add_instance_server`, `list_instance_screenshots`, `save_instance_screenshot_as`, `rename_instance_screenshot`, `list_instance_shortcuts`, `toggle_instance_shortcut`, `refresh_instance_shortcut_icon` || `minecraft_commands.rs` | `list_minecraft_versions` (async), `launch_instance` (async), `stop_instance`, `cancel_launch`, `get_total_system_memory_mb`, `list_audio_output_devices`, `get_java_info`, `take_pending_launch` |
| `account_commands.rs` | `list_accounts`, `create_account`, `update_account`, `delete_account`, `set_default_account`, `reorder_accounts` |
| `mod_commands.rs` | `search_mods`, `get_mod_versions`, `get_mod_project` (async), `install_mod` (async), `install_custom_mod`, `list_instance_mods`, `get_suggested_memory`, `set_instance_mod_enabled`, `delete_instance_mod`, `install_modrinth_modpack`, `install_curseforge_modpack` (async), `cancel_modpack_install` |
| `skin_commands.rs` | `search_skins`, `get_skin`, `download_skin`, `fetch_skin_texture_base64` (async) || `astropack_commands.rs` | `preview_astropack`, `get_astropack_export_summary`, `export_instance`, `import_astropack` (async), `take_pending_astropack_path` |
| `playtime_commands.rs` | `get_playtime_summary` |
| `settings_commands.rs` | `get_settings`, `update_settings` |
| `discord_commands.rs` | `discord_set_presence` |
| `custom_icon_commands.rs` | `list_custom_icons`, `save_custom_icon`, `delete_custom_icon` |
| `zerotier_commands.rs` | `zerotier_status`, `zerotier_install`, `zerotier_join`, `zerotier_leave`, `zerotier_list_networks`, `zerotier_list_owned_networks`, `zerotier_list_pending_members`, `zerotier_approve_member`, `zerotier_deauthorize_member` |
| `splash_commands.rs` | `finish_splash` |

## 6.2 Cada Comando Deve Ser Fino

```rust
#[tauri::command]
async fn create_instance(
    input: CreateInstanceInput,
    state: State<'_, AppState>,
) -> Result<InstanceDTO, InstanceError> {
    CreateInstanceUseCase::new(state.instance_repo.clone())
        .execute(input)
        .await
}
```

O comando só recebe o DTO de input, delega pro use case/service e retorna o DTO — sem lógica de negócio no handler.

## 6.3 Frontend: API Client

`src/lib/api/client.ts` expõe um wrapper fino:

```typescript
export function apiInvoke<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  return invoke<T>(command, args)
}
```

Cada feature tem seu próprio módulo de serviço em `src/features/*/services/*.api.ts` (ex.: `instance.api.ts`, `account.api.ts`, `folder.api.ts`, `mod.api.ts`, `skin.api.ts`, `astropack.api.ts`, `playtime.api.ts`, `settings.api.ts`, `custom-icon.api.ts`, `version.api.ts`) que chama `apiInvoke` internamente. Componentes não chamam `invoke()` direto.

## 6.4 Eventos (Tauri Events)

| Evento               | Direção            | Descrição                                     |
| -------------------- | ------------------ | --------------------------------------------- |
| `launch://event`     | Backend → Frontend | Progresso/estágios do lançamento da instância |
| `instance://stopped` | Backend → Frontend | Instância/processo do jogo encerrou           |
| `modpack://event`    | Backend → Frontend | Progresso de instalação de modpack            |
| `astropack://event`  | Backend → Frontend | Progresso de import/export de AstroPack       |

Namespacing usa `://`, não `:`. `src/stores/launch.store.ts` ouve `launch://event` via `listen()` e atualiza `ProgressState { stage, currentItem, stageCurrent, stageTotal }`.

**Progresso do Forge/NeoForge (v0.5.2):** os eventos `Stage`/`Progress` do launch agora refletem o andamento real da instalação do loader — `mc_launcher_core::progress::ProgressEvent` é mapeado para labels PT-BR (`Resolvendo versão`, `Baixando bibliotecas`, `Extraindo bibliotecas nativas`...) e a fase `DownloadLibraries` emite progresso por item (bibliotecas concluídas / total). A fase de assets não emite evento por arquivo (seriam milhares).

## 6.5 Tipos Compartilhados

Não há geração automática — os tipos em `src/types/*.ts` são escritos manualmente e mantidos em sincronia à mão com os DTOs Rust (`serde`). Cuidado ao mudar um DTO no backend: atualizar o tipo TS correspondente é manual.
