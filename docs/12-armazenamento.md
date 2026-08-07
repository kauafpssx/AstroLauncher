# 12 — Armazenamento de Dados

## 12.1 Filosofia

| Camada              | Tecnologia            | Motivo                                          |
| ------------------- | --------------------- | ----------------------------------------------- |
| Dados do launcher   | **SQLite** (bundled)  | Relações, queries, ACID                         |
| Config de usuário   | **JSON**              | Editável, simples                               |
| Assets do Minecraft | **Arquivos por hash** | Padrão Mojang (SHA1 prefix folders), inalterado |

Não existe cache em disco (manifests, buscas, thumbnails) — nenhum subsistema de cache está implementado hoje. Isso é uma lacuna real, não uma decisão de design (ver [09 — Evoluções Futuras](09-evolucoes-futuras.md)).

## 12.2 SQLite — Estrutura do Banco

Caminho real: **`<app_data_dir>/data/launcher.db`**, resolvido via `app.path().app_data_dir()` do Tauri (não a crate `dirs`). Migrações rodam no `bootstrap::setup::build_app_state()`.

### 12.2.1 Schema (v1 — `migrations/v1_initial.rs`)

```sql
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
```

### 12.2.2 Migrações posteriores (v2–v6, aplicadas via `ALTER TABLE`)

| Versão | Arquivo                   | Mudança                                                                                          |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------------ |
| v2     | `v2_account_ordering.rs`  | `accounts` ganha `position INTEGER NOT NULL DEFAULT 0` e `is_default INTEGER NOT NULL DEFAULT 0` |
| v3     | `v3_mod_icon.rs`          | `instance_mods` ganha `icon_url TEXT`                                                            |
| v4     | `v4_mod_kind.rs`          | `instance_mods` ganha `kind TEXT NOT NULL DEFAULT 'mod'` (`mod`/`resourcepack`/`shader`)         |
| v5     | `v5_instance_position.rs` | `instances` ganha `position INTEGER NOT NULL DEFAULT 0`                                          |
| v6     | `v6_folder_icon.rs`       | `folders` ganha `icon_path TEXT`                                                                 |

`installed_modpacks` existe no schema desde v1, mas não há repositório dedicado para ela na camada de domínio (repos ativos cobrem instance/folder/account/mod/playtime).

## 12.3 JSON — Configurações do Usuário

Só existe **um** arquivo de config JSON: **`<app_data_dir>/settings.json`**, via `infrastructure/persistence/config/json_settings_repository.rs`. Não existem `java.json` ou `ui.json` — Java é detectado/gerenciado direto no disco (sem tracking em JSON).

**`<app_data_dir>/window-state.json` (v0.5.2+):** persistência da janela principal (posição, tamanho, maximizado, monitor) — salvo no `CloseRequested` e restaurado no boot por `infrastructure/window_state.rs`. Implementação própria, não usa `tauri-plugin-window-state` (bug conhecido de restauração em monitor errado com DPI diferente — tauri-apps/plugins-workspace#244). Formato interno: offsets relativos ao monitor + nome do monitor; aplica posição antes do tamanho em unidades físicas.

```json
{
  "curseforge_api_key": null,
  "root_group_name": null,
  "root_group_icon": null
}
```

Schema real é bem menor do que versões anteriores deste documento sugeriam — não guarda `minecraft_dir`, `theme`, `discord_rpc` nem `max_downloads`.

## 12.4 Cache

Não implementado. Não existe `infrastructure/persistence/cache/`, nem cache de manifests, buscas (Modrinth/CurseForge) ou thumbnails. Toda chamada de busca/manifest bate direto na API externa.

## 12.5 Assets (Padrão Mojang)

```
<minecraft_dir>/assets/
├── indexes/     # Asset indexes (.json)
└── objects/     # Assets organizados por prefixo SHA1
```

Segue o padrão oficial do Minecraft, sem modificação — download feito por `infrastructure/downloader/asset_downloader.rs`.

## 12.6 Migrações — Mecanismo

`persistence/migrations/mod.rs` define uma tabela de function pointers:

```rust
pub const MIGRATIONS: &[(u32, fn(&Connection) -> rusqlite::Result<()>)] = &[
    (1, v1_initial::up),
    (2, v2_account_ordering::up),
    (3, v3_mod_icon::up),
    (4, v4_mod_kind::up),
    (5, v5_instance_position::up),
    (6, v6_folder_icon::up),
];
```

Versão atual comparada contra a tabela `meta` (`schema_version`). Roda no bootstrap, antes de qualquer repositório ser usado.

## 12.7 Dependências

```
rusqlite 0.40.1 (feature "bundled")
serde / serde_json 1.0
```

Sem `sqlx`, sem `rusqlite_migration` — migrações são escritas à mão.

## 12.8 Repository Pattern na Prática

As traits de repositório são **síncronas**, não `async_trait` — comentário no código: "Local SQLite database; no async needed."

```rust
// domain/repositories/instance_repository.rs
pub trait InstanceRepository: Send + Sync {
    fn find_all(&self) -> Result<Vec<Instance>, InstanceError>;
    fn find_by_id(&self, id: &str) -> Result<Instance, InstanceError>;
    fn find_by_folder(&self, folder_id: &str) -> Result<Vec<Instance>, InstanceError>;
    fn save(&self, instance: &Instance) -> Result<(), InstanceError>;
    fn delete(&self, id: &str) -> Result<(), InstanceError>;
    fn update_playtime(&self, id: &str, seconds: i64) -> Result<(), InstanceError>;
    fn reorder(&self, ordered_ids: &[String]) -> Result<(), InstanceError>;
}
```

`infrastructure/persistence/repositories/sqlite_instance_repository.rs` implementa a trait sobre uma `Arc<Mutex<rusqlite::Connection>>` compartilhada (montada uma vez no bootstrap). O domínio nunca importa `rusqlite` diretamente.

## 12.9 Estrutura Real de Pastas

```
infrastructure/persistence/
├── migrations/
│   ├── mod.rs
│   ├── v1_initial.rs
│   ├── v2_account_ordering.rs
│   ├── v3_mod_icon.rs
│   ├── v4_mod_kind.rs
│   ├── v5_instance_position.rs
│   └── v6_folder_icon.rs
├── sqlite/
│   └── connection.rs        # open(db_path), pragma foreign_keys
├── repositories/
│   ├── sqlite_instance_repository.rs
│   ├── sqlite_folder_repository.rs
│   ├── sqlite_account_repository.rs
│   ├── sqlite_playtime_repository.rs
│   └── sqlite_mod_repository.rs
└── config/
    └── json_settings_repository.rs
```

Sem subpasta `cache/`.

## 12.10 Resumo das Decisões

| Decisão           | Escolha                       | Motivo                                                         |
| ----------------- | ----------------------------- | -------------------------------------------------------------- |
| Banco principal   | SQLite (`rusqlite`, bundled)  | Queries, relações, ACID, sem dependência externa de binário    |
| Config de usuário | JSON (`settings.json`)        | Editável, simples — schema hoje é mínimo                       |
| ORM/Query Builder | Nenhum (SQL raw)              | Projeto pequeno, controle total                                |
| Migrações         | Function-pointer table manual | Sem dependência de `sqlx-cli`/`rusqlite_migration`             |
| Async no banco    | Não — repositórios síncronos  | Banco local, sem necessidade de I/O assíncrono                 |
| Cache             | Não implementado              | Lacuna conhecida, não decisão deliberada                       |
| Estado da janela  | JSON (`window-state.json`)    | Implementação própria em `window_state.rs`, sem plugin oficial |
