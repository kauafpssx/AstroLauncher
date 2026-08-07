# 04 — Módulos e Domínios

## 4.1 Organização Real

Diferente do organizado "por domínio" (um `mod.rs` por feature contendo entity/service/repository/events), o código está organizado **por camada**: `domain/{entities,repositories,errors}` e `application/{use_cases,dto,mappers}`. Não existem eventos de domínio nem tipos `Command`/`Query` — leitura e escrita são separadas por convenção (structs diferentes), não por tipagem formal.

Apenas 5 entidades de domínio existem hoje. Tudo o que não está na lista abaixo (mods, modpacks, java, skins, astropack, settings, workspace de instância) é implementado só na application layer, sobre infraestrutura de filesystem/HTTP — sem entidade, trait de repositório ou erro dedicado no domínio.

## 4.2 Entidades de Domínio (`src-tauri/app/domain/entities/`)

### `Instance` (instance.rs)

id, name, version, loader, loader_version, icon_path, java_args, min_memory, max_memory, folder_id, position, created_at, last_played, playtime_seconds.

### `Account` (account.rs)

id, username, account_type, uuid, position, is_default, last_used, created_at. Construtor `Account::new_offline(username, position)`.

### `Folder` (folder.rs)

id, name, position, collapsed, icon_path.

### `InstalledMod` (installed_mod.rs)

id, instance_id, mod_id, source, name, version, file_path, icon_url, kind (`mod`/`resourcepack`/`shader`), enabled, installed_at.

### `PlaytimeSession` (playtime_session.rs)

id, instance_id, started_at, ended_at, duration_seconds.

## 4.3 Traits de Repositório (`domain/repositories/`)

- **InstanceRepository**: find_all, find_by_id, find_by_folder, save, delete, update_playtime, reorder
- **AccountRepository**: find_all, find_by_id, save, delete, set_default, reorder
- **FolderRepository**: find_all, find_by_id, save, delete, reorder
- **ModRepository**: find_by_instance, find_by_instance_and_kind, save, delete, set_enabled
- **PlaytimeRepository**: insert, find_by_id, find_latest_by_instance, find_open_by_instance, update_end

Todos síncronos (sem `async_trait`) — comentário no código: "Local SQLite database; no async needed."

## 4.4 Erros de Domínio (`domain/errors/`, thiserror)

- `InstanceError`: NotFound, AlreadyExists, InvalidName, AlreadyRunning, Persistence — também reaproveitado como erro de `ModRepository` e `PlaytimeRepository`
- `AccountError`: NotFound, InvalidUsername, Persistence
- `FolderError`: NotFound, InvalidName, Persistence

## 4.5 Application Layer — Use Cases e Services (`application/use_cases/`)

Padrão "um struct por ação" para CRUD simples:

| Domínio  | Use Cases                                                                                                                                                                                                                                   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instance | `CreateInstanceUseCase`, `UpdateInstanceUseCase`, `DeleteInstanceUseCase`, `ListInstancesUseCase`, `MoveInstanceToFolderUseCase`, `ReorderInstancesUseCase`, `LaunchInstanceUseCase` (async, emite `LaunchEventDTO`), `StopInstanceUseCase` |
| Account  | `CreateAccountUseCase`, `UpdateAccountUseCase`, `DeleteAccountUseCase`, `ListAccountsUseCase`, `SetDefaultAccountUseCase`, `ReorderAccountsUseCase`                                                                                         |
| Folder   | `CreateFolderUseCase`, `UpdateFolderUseCase`, `DeleteFolderUseCase`, `ListFoldersUseCase`, `ReorderFoldersUseCase`                                                                                                                          |
| Versões  | `FetchVersionManifestUseCase` (async) → `Vec<VersionDTO>`                                                                                                                                                                                   |
| Memória  | `SuggestMemoryUseCase` (v0.5.2): `suggest_memory_mb(content_count)` → `SuggestedMemoryDTO { minMb, maxMb }` — heurística pura sem I/O, aplicada no fim da instalação de modpack e exposta via comando `get_suggested_memory`                |

Features maiores usam um único "Service" com vários métodos em vez de um use case por ação:

- **PlaytimeService**: start_session, end_session, get_summary
- **InstanceWorkspaceService**: notas, mundos, servers.dat, screenshots, config files, read_log, open_folder — tudo por instance_id
- **ModManagerService**: list, install (async), install_custom, set_enabled, delete
- **ModBrowserService**: search, get_versions, get_project (async, Modrinth/CurseForge)
- **ModpackInstallerService**: install_modrinth_modpack, install_curseforge_modpack (async), cancel
- **AstroPackService**: preview, get_export_summary, export_instance, import_astropack (async) — formato próprio de export/import de instâncias
- **CustomIconService**: list, save (base64 PNG), delete
- **SettingsService**: get, update
- **SkinBrowserService**: search, get_skin, download_skin, fetch_skin_texture_base64 (async, via PlayerMC/MCStat)

## 4.6 DTOs (`application/dto/`)

Um arquivo por domínio: `account_dto.rs`, `folder_dto.rs`, `instance_dto.rs` (inclui `SuggestedMemoryDTO` desde v0.5.2), `mod_dto.rs`, `playtime_dto.rs`, `settings_dto.rs`, `astropack_dto.rs`, além de DTOs sem entidade de domínio (derivados de filesystem): `NoteDTO`, `WorldDTO`, `ScreenshotDTO`, `ServerEntryDTO`, `ConfigFileDTO`, `CustomIconDTO`, `LaunchEventDTO`, `VersionDTO`, `SkinPlayerDTO`/`SkinSummaryDTO`/`SkinDetailDTO`.

Mappers (`application/mappers/`) só fazem entidade → DTO: `account_mapper`, `folder_mapper`, `instance_mapper`.
