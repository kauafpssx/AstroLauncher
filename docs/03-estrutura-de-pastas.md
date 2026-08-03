# 03 — Estrutura de Pastas

## 3.1 Raiz do Projeto

```
AstroLauncher/
├── src-tauri/             # Backend Rust + Tauri
├── src/                   # Frontend React
├── public/                # Assets estáticos (logo, ícones, providers)
├── docs/                  # Documentação
├── package.json
├── components.json        # shadcn/ui config
├── .gitignore
└── README.md
```

## 3.2 Backend (src-tauri/)

```
src-tauri/
├── app/
│   ├── application/
│   │   ├── use_cases/         # Um struct por ação (Create/Update/Delete/List*UseCase)
│   │   ├── dto/                # DTOs de entrada/saída por domínio
│   │   └── mappers/            # Entidade → DTO (account, folder, instance)
│   │
│   ├── domain/
│   │   ├── entities/          # Instance, Account, Folder, InstalledMod, PlaytimeSession
│   │   ├── repositories/      # Traits: InstanceRepository, AccountRepository, FolderRepository,
│   │   │                       #   ModRepository, PlaytimeRepository
│   │   └── errors/            # InstanceError, AccountError, FolderError (thiserror)
│   │
│   ├── infrastructure/
│   │   ├── minecraft/         # manifest, rules, servers_dat, version_meta
│   │   ├── java/               # detect, download (Adoptium), manager
│   │   ├── downloader/         # file_downloader, asset_downloader, progress
│   │   ├── process/            # manager (spawn/kill), launcher (comando Java, natives)
│   │   ├── filesystem/         # paths.rs — path-joining sobre app_data_dir
│   │   ├── discord/            # rpc.rs — Discord Rich Presence
│   │   ├── modloader/          # fabric_like, forge_like (via mc-launcher-core), liteloader, profile
│   │   ├── curseforge/         # client, modpack
│   │   ├── modrinth/           # client, mrpack
│   │   ├── playermc/           # client — busca de skins (api.playermc.site)
│   │   └── persistence/
│   │       ├── sqlite/         # connection.rs
│   │       ├── migrations/     # v1..v6 (function-pointer table)
│   │       ├── repositories/   # Sqlite*Repository (implementações)
│   │       └── config/         # json_settings_repository.rs (settings.json)
│   │
│   ├── presentation/
│   │   ├── commands/           # *_commands.rs — um arquivo por domínio, #[tauri::command]
│   │   ├── state/               # app_state.rs — AppState (managed state), é módulo, não arquivo único
│   │   └── ipc/                 # instance.rs — layout legado paralelo, não usado pelos commands atuais
│   │
│   └── bootstrap/
│       └── setup.rs            # build_app_state() — DI manual, única fonte de wiring
│
├── capabilities/default.json  # permissões/plugins Tauri
├── tauri.conf.json
├── Cargo.toml
└── build.rs
```

## 3.3 Frontend (src/)

```
src/
├── components/
│   ├── ui/                # Primitivas shadcn/ui (30+: button, dialog, select, table, tabs...)
│   ├── common/             # CodeEditor, EntityAvatar, PageHeader, SearchInput, SidebarNav...
│   ├── layout/             # Shell, TopBar, StatusBar, AccountDropdown, LaunchProgressDialog
│   └── splash/             # SplashScreen (janela separada, ver splash-main.tsx)
│
├── features/               # Feature-first — pastas reais:
│   ├── instances/          # maior feature: criar/editar/listar instâncias, pastas, astropack,
│   │                        #   ícones, workspace (notas, mundos, servers, screenshots, config)
│   ├── mods/                # Mod Browser + gerenciamento de mods instalados
│   ├── accounts/            # contas offline (CRUD, sheet, dialog)
│   ├── skins/                # busca e preview 3D de skins
│   └── settings/             # página de configurações
│   (não existem features "launcher/", "java/" ou "download/" — launch fica em stores/launch.store.ts
│    + components/layout/LaunchProgressDialog.tsx; java/download não têm UI dedicada)
│
├── hooks/
│   └── useDiscordPresence.ts  # único hook global
│
├── data/
│   └── mc-icons.ts
│
├── lib/
│   ├── api/client.ts       # apiInvoke<T>() — wrapper fino sobre @tauri-apps/api invoke
│   ├── utils.ts
│   ├── content-kind.ts
│   ├── format.ts
│   ├── icon-src.ts
│   ├── keybind-utils.ts
│   ├── log-utils.ts
│   └── minecraft-options.ts
│
├── stores/                 # Zustand
│   ├── account.store.ts
│   ├── folder.store.ts
│   ├── instance.store.ts
│   ├── launch.store.ts
│   ├── link-preview.store.ts
│   └── modpack-install.store.ts
│
├── types/                  # Tipos TS espelhando os DTOs Rust manualmente (sem codegen)
├── main.tsx                 # Entry point do app principal
├── splash-main.tsx          # Entry point da janela de splash (segundo entry point do Vite)
└── App.tsx                  # HashRouter + rotas
```

Rotas reais (`App.tsx`, `react-router-dom` v7 com `HashRouter`): `/`, `/instances/new`, `/instances/:id/edit`, `/skins`. Não existem rotas para settings/java/downloads/console — essas telas são dialogs/tabs dentro das páginas de instância.
