# 02 — Arquitetura Técnica

## 2.1 Visão em Camadas

```
React UI (src/)
    │
    ▼ invoke()
Tauri Commands — src-tauri/app/presentation/commands/*_commands.rs
    │
    ▼
Application Layer — src-tauri/app/application/{use_cases, dto, mappers}
    │
    ▼
Domain Layer — src-tauri/app/domain/{entities, repositories, errors}
    │
    ▼
Infrastructure Layer — src-tauri/app/infrastructure/*
```

**Regra fundamental:** a UI nunca conversa diretamente com a Infrastructure. Ela conversa apenas com use cases/services expostos via comandos Tauri.

## 2.2 Fluxo de Execução

```
React UI → src/features/*/services/*.api.ts (apiInvoke) → #[tauri::command]
    → Use Case / Service (application) → Repository (trait, domain)
    → Implementação concreta (infrastructure) → SQLite / FileSystem / HTTP / mc-launcher-core
```

## 2.3 Responsabilidades por Camada

### 2.3.1 Presentation

`src-tauri/app/presentation/commands/` — um arquivo `*_commands.rs` por domínio (instance, folder, account, mod, skin, astropack, playtime, settings, discord, custom_icon, splash, minecraft, instance_workspace). Registrados em `tauri::generate_handler![...]` em `src-tauri/src/lib.rs`. Recebem DTOs de input, chamam o use case/service correspondente, retornam DTOs serializáveis. `presentation/state/app_state.rs` guarda o `AppState` (repositórios, http client, etc) injetado via Tauri managed state. Existe também `presentation/ipc/` (`instance.rs`) — layout legado paralelo, não é o caminho usado pelos comandos atuais.

### 2.3.2 Application Layer

`src-tauri/app/application/`. Não existe separação formal em tipos `Command`/`Query` nem um event bus — é uma convenção "CQRS-lite": operações de escrita e leitura ficam em structs separadas (`CreateInstanceUseCase` vs `ListInstancesUseCase`), cada uma com um único `execute()`. Features maiores (mods, astropack, workspace de instância, settings, skins) usam um único "Service" com vários métodos em vez de um struct por ação. DTOs e mappers entidade→DTO vivem em `dto/` e `mappers/`.

### 2.3.3 Domain Layer

`src-tauri/app/domain/`. Cobre hoje só `Instance`, `Account`, `Folder`, `InstalledMod`, `PlaytimeSession` (entities/), seus traits de repositório (repositories/) e erros tipados via `thiserror` (errors/: `InstanceError`, `AccountError`, `FolderError` — `InstanceError` é reaproveitado para mods e playtime). Não há eventos de domínio nem "domain services" como tipo separado — regras de negócio ficam nos construtores/métodos das próprias entidades. Features como mods/modpacks, java, skins, astropack, settings e workspace de instância não têm entidade de domínio própria: são implementadas direto na application layer sobre infra de filesystem/HTTP.

### 2.3.4 Infrastructure Layer

`src-tauri/app/infrastructure/`: `minecraft/` (manifest, rules, servers.dat, version meta, language), `java/` (detect, download, manager), `downloader/` (file + asset downloader, progress — sem retry, reqwest puro), `process/` (manager + launcher), `filesystem/` (paths), `discord/` (RPC), `modloader/` (fabric_like, forge_like, liteloader, profile), `curseforge/`, `modrinth/`, `playermc/` + `mcstat/` (skins), `persistence/` (sqlite, migrations, repositories, config), `window_state.rs` (v0.5.2, persistência da janela principal). Forge/NeoForge delegam boa parte do trabalho para a crate externa `mc-launcher-core`.

### 2.3.5 Bootstrap

`src-tauri/app/bootstrap/setup.rs::build_app_state(...)` é o ponto único de wiring: abre a conexão SQLite, roda migrations, monta os 5 repositórios como `Arc<dyn Trait>`, monta o `reqwest::Client` e retorna o `AppState` usado pela Presentation. Chamado uma vez em `src-tauri/src/lib.rs` no setup do Tauri.

## 2.4 Princípios de Design

- **Dependency Inversion:** Domain define traits; Infrastructure implementa
- **Composição sobre herança:** Rust favorece composição naturalmente
- **Fail fast:** erros modelados como enums tipados (`thiserror`), nunca `String`
- **Testabilidade:** Domain e Application não dependem de I/O direto (repositórios são traits)
