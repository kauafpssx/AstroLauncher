# 12 — Armazenamento de Dados

## 12.1 Filosofia

```
SQLite para dados estruturados e relacionais
JSON para configurações editáveis pelo usuário
Cache em arquivos temporários (sem persistência)
Assets seguem o padrão Mojang (objects por hash)
```

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Dados do launcher | **SQLite** | Relações, queries, ACID, concorrência |
| Config de usuário | **JSON** | Editável manualmente, versionável, simples |
| Cache de API | **Arquivos JSON** | TTL curto, sem necessidade de schema |
| Cache de assets | **Arquivos por hash** | Padrão Mojang (SHA1 prefix folders) |

## 12.2 SQLite — Estrutura do Banco

O banco fica em `<launcher_dir>/data/launcher.db` (ou `<launcher_dir>/launcher.db`).

### 12.2.1 Schema

```sql
-- Instâncias
CREATE TABLE instances (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    version     TEXT NOT NULL,
    loader      TEXT,                  -- null, 'fabric', 'quilt'
    loader_version TEXT,
    icon_path   TEXT,
    java_args   TEXT,                  -- argumentos JVM customizados
    min_memory  INTEGER DEFAULT 2048,
    max_memory  INTEGER DEFAULT 4096,
    folder_id   TEXT REFERENCES folders(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_played TEXT,
    playtime_seconds INTEGER DEFAULT 0  -- denormalizado para acesso rápido
);

-- Pastas
CREATE TABLE folders (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    collapsed   INTEGER NOT NULL DEFAULT 0  -- boolean
);

-- Sessões de Playtime
CREATE TABLE playtime_sessions (
    id          TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    started_at  TEXT NOT NULL,
    ended_at    TEXT,
    duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX idx_playtime_instance ON playtime_sessions(instance_id);
CREATE INDEX idx_playtime_started ON playtime_sessions(started_at);

-- Contas
CREATE TABLE accounts (
    id          TEXT PRIMARY KEY,
    username    TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'offline',  -- 'offline', 'microsoft' (futuro)
    uuid        TEXT,
    last_used   TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Mods instalados por instância (para CurseForge/Modrinth)
CREATE TABLE instance_mods (
    id          TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    mod_id      TEXT NOT NULL,           -- id do CurseForge ou Modrinth
    source      TEXT NOT NULL,           -- 'curseforge', 'modrinth'
    name        TEXT NOT NULL,
    version     TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    enabled     INTEGER NOT NULL DEFAULT 1,
    installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_mods_instance ON instance_mods(instance_id);

-- Modpacks instalados (metadados)
CREATE TABLE installed_modpacks (
    id          TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE UNIQUE,
    source      TEXT NOT NULL,           -- 'curseforge', 'modrinth'
    project_id  TEXT NOT NULL,
    project_name TEXT NOT NULL,
    project_version TEXT NOT NULL,
    installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Metadados do launcher (chave-valor para migrações, etc.)
CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO meta (key, value) VALUES ('schema_version', '1');
```

### 12.2.2 Por que esse schema?

| Tabela | Justificativa |
|--------|--------------|
| `instances` | Denormalizamos `playtime_seconds` para evitar JOIN caro na listagem |
| `playtime_sessions` | Cada sessão individual permite históricos, gráficos por dia/mês |
| `folders` | Relação 1:N com instances via `folder_id` |
| `instance_mods` | Rastrear mods instalados por instância (CurseForge/Modrinth) |
| `installed_modpacks` | Metadado do modpack de origem (se veio de CF ou Modrinth) |
| `accounts` | Suporte futuro a múltiplas contas (offline + Microsoft) |
| `meta` | Controle de versão do schema para migrações |

## 12.3 JSON — Configurações do Usuário

Arquivos JSON na raiz do diretório do launcher:

```
<launcher_dir>/
├── settings.json         # Configurações gerais
├── java.json             # Configurações de Java
└── ui.json               # Preferências de interface (tema, sidebar, etc.)
```

### Exemplo: `settings.json`

```json
{
  "minecraft_dir": "C:\\Users\\User\\AppData\\Roaming\\.minecraft",
  "launcher_dir": "C:\\Users\\User\\AppData\\Roaming\\AstroLauncher",
  "language": "pt-BR",
  "theme": "dark",
  "close_behavior": "minimize",
  "discord_rpc": true,
  "max_downloads": 4,
  "java_path": null
}
```

### Exemplo: `java.json`

```json
{
  "default_runtime": "jre-17.0.9",
  "runtimes": [
    {
      "id": "jre-17.0.9",
      "path": "C:\\Users\\User\\AppData\\Roaming\\AstroLauncher\\java\\jre-17.0.9",
      "version": "17.0.9",
      "arch": "x64",
      "type": "temurin"
    },
    {
      "id": "jre-21.0.3",
      "path": "C:\\Users\\User\\AppData\\Roaming\\AstroLauncher\\java\\jre-21.0.3",
      "version": "21.0.3",
      "arch": "x64",
      "type": "temurin"
    }
  ]
}
```

**Regra:** Config JSON nunca contém dados grandes ou relacionais. Apenas preferências do usuário.

## 12.4 Cache

```
<launcher_dir>/cache/
├── manifests/            # Version manifest da Mojang (cache 1h)
├── search/               # Resultados de busca CF/Modrinth (cache 30min)
└── thumbnails/           # Thumbnails de modpacks (cache 24h)
```

- Cache tem TTL fixo, sem necessidade de SQLite
- Arquivos individuais com nome = hash da URL
- Limpeza automática ao iniciar o launcher (itens expirados)

## 12.5 Assets (Padrão Mojang)

```
<minecraft_dir>/assets/
├── indexes/              # Asset indexes (.json)
└── objects/              # Assets organizados por prefixo SHA1
    ├── 00/
    ├── 01/
    └── ...
```

Segue o padrão oficial do Minecraft. Nenhuma modificação.

## 12.6 Migrações

O SQLite permite migrações progressivas via tabela `meta`:

```rust
trait Migration {
    fn version(&self) -> u32;
    fn up(&self, tx: &Transaction) -> Result<()>;
}

// migrations/v1.rs
struct V1CreateInstances;
impl Migration for V1CreateInstances { ... }

// migrations/v2.rs
struct V2AddPlaytimeIndex;
impl Migration for V2AddPlaytimeIndex { ... }
```

- Migrações rodam na inicialização do launcher
- Versão atual comparada com `schema_version` na tabela `meta`
- Todas dentro de transação — falha = rollback

## 12.7 Dependências

```
Rust:
├── rusqlite              # SQLite bindings (com bundled feature)
├── serde_json            # JSON para configs
└── serde                 # Serialização geral
```

### Por que `rusqlite` e não `sqlx`?

| Critério | `rusqlite` | `sqlx` |
|----------|-----------|--------|
| Simplicidade | Sim, conexão direta | Complexo, prefere pool |
| Async | Síncrono (suficiente para dados locais) | Async-only |
| Compile-time checks | Não | Sim |
| Bundled SQLite | Sim (`bundled` feature) | Não incluso |
| Migrations | Manual (simples) | Built-in com `sqlx-cli` |

**Decisão:** `rusqlite` com `bundled` — não precisamos de pool de conexões nem async para um banco local de um launcher desktop.

## 12.8 Repository Pattern na Prática

```rust
// domain/repositories/instance_repository.rs
#[async_trait]
pub trait InstanceRepository: Send + Sync {
    async fn find_all(&self) -> Result<Vec<Instance>>;
    async fn find_by_id(&self, id: &str) -> Result<Instance>;
    async fn find_by_folder(&self, folder_id: &str) -> Result<Vec<Instance>>;
    async fn save(&self, instance: &Instance) -> Result<()>;
    async fn delete(&self, id: &str) -> Result<()>;
    async fn update_playtime(&self, id: &str, seconds: i64) -> Result<()>;
}
```

```rust
// infrastructure/repositories/sqlite_instance_repository.rs
pub struct SqliteInstanceRepository {
    conn: rusqlite::Connection,
}

impl InstanceRepository for SqliteInstanceRepository {
    async fn find_all(&self) -> Result<Vec<Instance>> {
        let mut stmt = self.conn.prepare("SELECT id, name, version, ... FROM instances ORDER BY name")?;
        // ... mapeamento para Vec<Instance>
    }
}
```

O domínio **nunca** importa `rusqlite`. Ele só conhece a trait. A Application Layer injeta a implementação concreta no bootstrap.

## 12.9 Estrutura de Pastas

```
infrastructure/persistence/
├── migrations/
│   ├── mod.rs
│   ├── v1_initial.rs
│   └── v2_playtime_index.rs
├── sqlite/
│   ├── connection.rs       # Inicialização e pool (na verdade conexão única)
│   ├── migration_runner.rs
│   └── mod.rs
├── repositories/
│   ├── sqlite_instance_repository.rs
│   ├── sqlite_folder_repository.rs
│   ├── sqlite_account_repository.rs
│   ├── sqlite_playtime_repository.rs
│   └── sqlite_mod_repository.rs
├── config/
│   ├── json_settings_repository.rs
│   └── json_java_repository.rs
└── cache/
    ├── manifest_cache.rs
    └── search_cache.rs
```

## 12.10 Resumo das Decisões

| Decisão | Escolha | Alternativa Rejeitada | Motivo |
|---------|---------|----------------------|--------|
| Banco principal | SQLite | JSON | Queries, relações, ACID, concorrência |
| Config de usuário | JSON | SQLite | Editável, versionável, simples |
| ORM/Query Builder | Nenhum (SQL raw) | Diesel, SeaORM | Projeto pequeno, controle total |
| Biblioteca SQLite | `rusqlite` | `sqlx` | Síncrono, bundled, simples |
| Cache | Arquivos com TTL | SQLite | Volátil, sem necessidade de schema |
| Migrações | Manuais com trait | `sqlx-cli` | Sem dependência externa |
| Async no banco | Não necessário | Tokio + sqlx | Banco local, operações em microssegundos |
