# 03 — Estrutura de Pastas

## 3.1 Raiz do Projeto

```
project-root/
├── src-tauri/             # Backend Rust + Tauri
├── src/                   # Frontend React
├── public/                # Assets estáticos
├── docs/                  # Documentação
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json        # shadcn/ui config
├── .gitignore
└── README.md
```

## 3.2 Backend (src-tauri/)

```
src-tauri/
├── app/
│   ├── application/
│   │   ├── commands/          # Command structs (CQRS)
│   │   ├── queries/           # Query structs (CQRS)
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── services/          # Serviços de aplicação
│   │   ├── events/            # Event handlers
│   │   ├── mappers/           # Conversores Domain ↔ DTO
│   │   └── use_cases/         # Casos de uso (orquestração)
│   │
│   ├── domain/
│   │   ├── entities/          # Entidades de domínio
│   │   ├── value_objects/     # Value Objects
│   │   ├── repositories/      # Traits de repositório
│   │   ├── services/          # Serviços de domínio
│   │   ├── traits/            # Outras traits do domínio
│   │   ├── errors/            # Erros de domínio
│   │   └── events/            # Eventos de domínio
│   │
│   ├── infrastructure/
│   │   ├── minecraft/         # API Minecraft, manifestos
│   │   ├── java/              # Detecção, instalação, runtime
│   │   ├── filesystem/        # Manipulação de arquivos
│   │   ├── downloader/        # Download manager, queue, worker
│   │   ├── cache/             # Cache de assets e metadados
│   │   ├── process/           # Process spawn, monitor, kill
│   │   ├── persistence/       # SQLite, JSON, config files
│   │   ├── api/               # HTTP clients genéricos
│   │   └── repositories/      # Implementações concretas
│   │
│   ├── presentation/
│   │   ├── commands/          # #[tauri::command] handlers
│   │   ├── state/             # Estado global gerenciado (managed state)
│   │   └── ipc/               # Organização por domínio (instance, java, etc.)
│   │
│   ├── shared/
│   │   ├── config/            # Leitura de configurações
│   │   ├── logger/            # Logger estruturado
│   │   ├── utils/             # Utilitários separados por contexto
│   │   │   ├── path_utils.rs
│   │   │   ├── hash_utils.rs
│   │   │   ├── zip_utils.rs
│   │   │   └── json_utils.rs
│   │   ├── constants/         # Constantes do launcher
│   │   ├── errors/            # Erros compartilhados
│   │   └── macros/            # Macros utilitárias
│   │
│   └── bootstrap/             # Inicialização e DI manual
│       ├── modules.rs
│       ├── di.rs
│       └── setup.rs
│
├── tauri.conf.json
├── Cargo.toml
└── build.rs
```

## 3.3 Frontend (src/)

```
src/
├── components/            # Componentes compartilhados (shadcn/ui)
│   ├── ui/                # Button, Card, Dialog, Input, etc.
│   └── layout/            # Sidebar, Header, Shell
│
├── features/              # Feature-First organization
│   ├── instances/
│   │   ├── components/    # InstanceCard, InstanceList, CreateDialog
│   │   ├── hooks/         # useInstances, useInstanceActions
│   │   ├── services/      # InstanceAPI (invoke wrappers)
│   │   ├── types/         # Instance types
│   │   └── pages/         # InstancesPage
│   │
│   ├── launcher/
│   │   ├── components/    # LaunchButton, ConsoleView, ProgressBar
│   │   ├── hooks/         # useLaunch, useConsole
│   │   ├── services/      # LauncherAPI
│   │   ├── types/         # Launch types
│   │   └── pages/         # LauncherPage
│   │
│   ├── java/
│   │   ├── components/    # JavaSelector, JavaInstallDialog
│   │   ├── hooks/         # useJava, useJavaInstall
│   │   ├── services/      # JavaAPI
│   │   └── types/         # Java types
│   │
│   ├── settings/
│   │   ├── components/    # SettingsForm, PathPicker
│   │   ├── hooks/         # useSettings
│   │   ├── services/      # SettingsAPI
│   │   └── pages/         # SettingsPage
│   │
│   └── download/
│       ├── components/    # DownloadQueue, ProgressIndicator
│       ├── hooks/         # useDownload, useDownloadQueue
│       └── types/         # Download types
│
├── hooks/                 # Hooks globais
├── lib/                   # Utilitários
│   ├── api/               # API client base
│   ├── utils.ts           # Utilitários gerais
│   └── constants.ts       # Constantes
│
├── stores/                # Zustand stores
│   ├── instance.store.ts
│   ├── java.store.ts
│   ├── download.store.ts
│   └── settings.store.ts
│
├── types/                 # Tipos globais
├── pages/                 # Páginas raiz (rotas)
├── layouts/               # Layouts compartilhados
├── main.tsx               # Entry point
└── App.tsx
```
