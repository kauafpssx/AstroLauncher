# 08 — Módulos de Infraestrutura

`src-tauri/app/infrastructure/`.

## 8.1 Download Manager

```
infrastructure/downloader/
├── file_downloader.rs   # download_to_file, verificação SHA1 (crate sha1)
├── asset_downloader.rs  # busca asset index, concorrência via futures::stream, CONCURRENCY = 16
└── progress.rs           # ProgressReporter/ProgressUpdate, contador atômico de bytes
```

Mais simples do que o nome sugere: sem fila/worker pool configurável, sem retry/backoff. Verificação de integridade via SHA1, pula download se o arquivo já é válido.

## 8.2 Process Manager

```
infrastructure/process/
├── manager.rs    # ProcessManager: rastreia PID por instance_id (Mutex<HashMap>), kill via taskkill/kill
└── launcher.rs   # LaunchOptions, resolução de classpath (Maven), extract_natives()
```

Sem módulos separados de monitor/stdout/stderr/kill — tudo concentrado nesses dois arquivos.

## 8.3 Java Manager

```
infrastructure/java/
├── detect.rs     # find_java()/detect_major_version() via JAVA_HOME e PATH
├── download.rs   # Adoptium API (api.adoptium.net) + extração do zip
└── manager.rs    # ensure_java(): usa Java do sistema se versão suficiente, senão baixa JRE portátil
```

Sem detecção via registro do Windows, sem tracking multi-versão em JSON — `ensure_java()` só compara a major version do Java já disponível contra a exigida; se insuficiente, baixa um JRE Temurin portátil para `<app_data_dir>/java/<major>/`.

## 8.4 Minecraft

```
infrastructure/minecraft/
├── manifest.rs     # fetch do version manifest da Mojang
├── rules.rs        # avaliação de regras (OS/arch/features) para libraries
├── servers_dat.rs  # leitura/escrita de servers.dat (NBT)
├── version_meta.rs # VersionMeta — modelo parseado do JSON de versão
└── language.rs     # (v0.5.2) ensure_default_language: detecta locale do Windows e grava `lang:` no options.txt
```

Boa parte da lógica de baixo nível (download de client jar, resolução de libraries, comando de launch para Forge/NeoForge) vive na crate externa `mc-launcher-core` (v0.1.2), não em arquivos locais — não existem `assets.rs`/`libraries.rs`/`client.rs`/`old_versions.rs`/`version_type.rs` no código. Download de assets fica em `downloader/asset_downloader.rs`.

`language.rs::ensure_default_language(instance_dir)` grava `lang:pt_br` no `options.txt` da instância no primeiro launch (locale do SO via `GetUserDefaultLocaleName`, Win32 FFI). **Nunca sobrescreve** um `options.txt` existente — respeita o que o usuário/modpack já configurou. Chamado no launch vanilla e no `run_forge_like`. Best-effort: falha nunca bloqueia o launch.

## 8.5 Modloader

```
infrastructure/modloader/
├── fabric_like.rs  # Fabric + Quilt (mesma API estilo Fabric-Meta)
├── forge_like.rs   # Forge + NeoForge, delega para mc_launcher_core::loader::{forge, neoforge}
├── liteloader.rs   # parse manual de dl.liteloader.com/versions/versions.json, cap em MC 1.12.2
└── profile.rs      # LoaderProfile/ProfileLibrary compartilhados + Maven URL builder
```

Dois pipelines distintos:

- **Fabric/Quilt**: consomem API REST (`meta.fabricmc.net/v2`, `meta.quiltmc.org/v3`) que já devolve um `LoaderProfile` pronto (main class + libraries), sem precisar rodar instalador.
- **Forge/NeoForge**: baixam e executam o jar instalador oficial do loader (`java -jar installer.jar --installClient <dir>`) via `mc_launcher_core`, exigindo o JSON da versão vanilla já em disco (`ensure_vanilla_json_on_disk`) para o merge `inheritsFrom` funcionar. Desde v0.5.2 também exige o stub `launcher_profiles.json` (`ensure_launcher_profile_stub`) — o instalador aborta com "There is no minecraft launcher profile" se o arquivo não existir no diretório de dados (herança do launcher vanilla da Mojang). Usa `mc_launcher_core::command::builder::build_launch_command` para o comando final, não `process/launcher.rs`. O progresso da instalação vem de `mc_launcher_core::progress::ProgressEvent` e é mapeado para labels PT-BR + progresso real de bibliotecas em `launch_instance.rs::run_forge_like`.

## 8.6 Filesystem

```
infrastructure/filesystem/paths.rs
```

Só path-joining puro sobre `app_data_dir`: `versions_dir`, `libraries_dir`, `assets_dir`, `custom_icons_dir`, `instances_dir`, `instance_dir`. Sem lógica de I/O aqui — as operações reais de arquivo ficam nos módulos que consomem esses paths (downloader, workspace, custom icons).

## 8.7 Discord RPC

```
infrastructure/discord/rpc.rs
```

`DiscordRpcHandle`: thread em background dona de um `DiscordIpcClient` (crate `discord-rich-presence`), canal mpsc, reconecta a cada 15s se o Discord não estiver rodando. Estados: `Idle`/`Custom{details,state}`/`Playing{instance_name, mod_count, started_at}`. `client_id`/`logo_asset_key` vêm de `tauri.conf.json` (`plugins.discord.clientId`/`.logoAssetKey`). `PresenceGuard` (RAII) reverte pra idle no drop.

## 8.8 Persistência

```
infrastructure/persistence/
├── sqlite/connection.rs          # open(db_path), pragma foreign_keys
├── migrations/mod.rs             # tabela de function pointers, v1..v6
├── repositories/                 # Sqlite{Instance,Folder,Playtime,Account,Mod}Repository
└── config/json_settings_repository.rs   # LauncherSettings (settings.json)
```

**Decisão:** SQLite para dados estruturados (instâncias, pastas, playtime, contas, mods), em `<app_data_dir>/data/launcher.db` (resolvido via `app.path().app_data_dir()` do Tauri, não a crate `dirs`). JSON só para `settings.json`, com schema pequeno: `curseforge_api_key`, `root_group_name`, `root_group_icon`. Não existe `java.json`/`ui.json`, nem uma pasta `cache/` dentro de persistence — nenhum subsistema de cache com TTL está implementado hoje (manifests e resultados de busca não são cacheados).

Ver [documento 12 — Armazenamento](12-armazenamento.md) para o schema completo.

## 8.9 CurseForge API

```
infrastructure/curseforge/
├── client.rs    # busca, DTOs de mod, class IDs (mod/modpack/resourcepack/shader)
└── modpack.rs
```

Usa CurseForge Core API (exige API key, injetada via secret `CURSEFORGE_API_KEY` no CI). Sem cache de busca.

## 8.10 Modrinth API

```
infrastructure/modrinth/
├── client.rs    # busca, detecção de loader via categorias
└── mrpack.rs
```

Usa Modrinth API v3 (pública, sem key). Sem cache de resultados.

## 8.11 PlayerMC (Skins)

```
infrastructure/playermc/client.rs
```

Integração com API de terceiros para texturas de skins: `api.playermc.site/v1`. Modelos `SkinPlayer`/`SkinSummary`/`SkinDetail`.

## 8.12 MCStat (Skins)

```
infrastructure/mcstat/client.rs
```

Fonte de skins adicionada na v0.4.0 (`mcstat.org`), usada na busca/detalhe de skins. Modelos `Skin`/`SkinOwner`/`SkinDetail`/`SkinPlayerUsing`. Substituiu a renderização de avatares que antes vinha do `vzge.me` (não mais utilizado).

## 8.13 Bootstrap

`src-tauri/app/bootstrap/setup.rs::build_app_state(app_data_dir, discord_client_id, discord_logo_asset_key)` é o único ponto de DI: abre SQLite, roda migrations, monta os 5 repositórios (`Arc<dyn Trait>` compartilhando uma `Arc<Mutex<Connection>>`), monta um `reqwest::Client` (`User-Agent: AstroLauncher/0.1.0`) e retorna o `AppState`. Chamado uma vez em `src-tauri/src/lib.rs` no setup do Tauri.

## 8.14 Window State

`infrastructure/window_state.rs` (v0.5.2): salva posição/tamanho/maximizado/monitor da janela principal em `<app_data_dir>/window-state.json` no `CloseRequested` e restaura no boot. Implementação própria que contorna o bug do `tauri-plugin-window-state` (tauri-apps/plugins-workspace#244: janela maximizada restaurada no monitor errado com DPIs diferentes) armazenando offsets relativos ao monitor + nome do monitor, e sempre aplicando posição antes do tamanho em unidades físicas. Best-effort: falha nunca bloqueia fechar/abrir o app.
