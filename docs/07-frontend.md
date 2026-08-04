# 07 — Frontend (React + shadcn/ui)

## 7.1 Organização Feature-First

Features reais em `src/features/`: `instances/`, `mods/`, `accounts/`, `skins/`, `settings/`. Não existem features `launcher/`, `java/` ou `download/` — launch é global (`stores/launch.store.ts` + `components/layout/LaunchProgressDialog.tsx`), e não há UI dedicada para Java/downloads.

```
src/features/instances/          # maior feature
├── pages/               # InstancesPage, CreateInstancePage, EditInstancePage
├── components/          # InstanceCard, InstanceGrid, FolderSection, GroupSection,
│                         #   ExportAstropackDialog, ImportAstropackDialog, IconPickerDialog...
│   ├── create-instance/ # FiltersCard, LoaderSelectionCard, ModpackBrowserPanel, VersionSelectionCard...
│   └── edit-instance/   # ConfigEditorTab, NotesTab, WorldsTab, ServersTab, ScreenshotsTab,
│                         #   KeybindsTab, LogTab, MinecraftOptionsTab, SettingsTab...
├── hooks/                # useInstances, useFolders, useLaunchInstance, usePlaytimeSummary,
│                         #   useInstanceActions, useInstanceIcon, useInstanceScreenshots, useVersions
├── lib/                  # instance-actions.ts
└── services/             # instance.api.ts, folder.api.ts, astropack.api.ts,
                          #   instance-workspace.api.ts, custom-icon.api.ts, playtime.api.ts, version.api.ts
```

Não há pasta `types/` dentro de cada feature — os tipos ficam centralizados em `src/types/`.

## 7.2 Componentes Compartilhados

```
components/
├── ui/          # 30+ primitivas shadcn/ui: accordion, alert-dialog, avatar, badge, button,
│                #   card, checkbox, collapsible, command, context-menu, dialog, dropdown-menu,
│                #   hover-card, input-group, pagination, popover, resizable, select, separator,
│                #   sheet, skeleton, slider, sonner, switch, table, tabs, toggle, tooltip...
├── common/      # CodeEditor, EntityAvatar, EntityContextMenu, MarkdownBody, PageHeader,
│                #   SearchInput, SidebarNav, TabHeader, ConfirmDeleteDialog, ProgressGroup...
├── layout/      # Shell, TopBar, StatusBar, AccountDropdown, LaunchProgressDialog
└── splash/      # SplashScreen — janela separada, ver 7.5
```

## 7.3 Stores (Zustand)

Stores reais em `src/stores/`:

- **account.store.ts** — `useAccountStore`: `{ accounts, isLoading }` + CRUD via AccountAPI; expõe `useDefaultAccount()`
- **folder.store.ts** — `useFolderStore`: `{ folders, isLoading }` + CRUD via FolderAPI
- **instance.store.ts** — `useInstanceStore`: `{ instances }`, ouve eventos Tauri via `listen()`, CRUD via InstanceAPI; expõe `useSelectedInstance()`
- **launch.store.ts** — `useLaunchStore`: estado de progresso do launch (`ProgressState { stage, currentItem, stageCurrent, stageTotal }`), ouve `launch://event`, dispara toasts
- **link-preview.store.ts** — `useLinkPreviewStore`: abre links externos via `@tauri-apps/plugin-shell`
- **modpack-install.store.ts** — `useModpackInstallStore`: `{ isInstalling, setInstalling }`

Não existem `java.store.ts`, `download.store.ts` ou `settings.store.ts`.

## 7.4 API Client

`src/lib/api/client.ts` — `apiInvoke<T>(command, args?)` envolve `invoke()` do `@tauri-apps/api/core`. Cada feature tem seus próprios módulos `*.api.ts` chamando `apiInvoke` com o nome do comando Tauri (ex.: `InstanceAPI.list() → apiInvoke<InstanceDTO[]>('list_instances')`).

## 7.5 Rotas Reais

`react-router-dom` v7 via `HashRouter`, rotas definidas inline em `App.tsx`:

| Rota                  | Página             |
| --------------------- | ------------------ |
| `/`                   | InstancesPage      |
| `/instances/new`      | CreateInstancePage |
| `/instances/:id/edit` | EditInstancePage   |
| `/skins`              | SkinsPage          |

Não existem `/settings`, `/java`, `/downloads`, `/console`, `/modpacks`, `/stats` — settings/mods/versões são dialogs/sheets/tabs dentro das páginas de instância, não rotas próprias. `LaunchProgressDialog` e `Toaster` renderizam fora de `<Routes>` como overlays globais.

Há dois entry points de Vite: `src/main.tsx` (app principal) e `src/splash-main.tsx` (janela de splash, usa `components/splash/SplashScreen.tsx`).

## 7.6 Outros

- `src/hooks/useDiscordPresence.ts` — único hook global (fora de features), atualiza Discord RPC
- `src/lib/`: além de `api/client.ts` e `utils.ts`, existem `content-kind.ts`, `format.ts`, `icon-src.ts`, `keybind-utils.ts`, `log-utils.ts`, `minecraft-options.ts` — sem `constants.ts`
- `src/types/`: interfaces TS mantidas manualmente em sincronia com os DTOs Rust — sem geração automática (nenhuma ferramenta de codegen tipo `ts-rs`/`specta` está em uso)
