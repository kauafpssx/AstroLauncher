# AGENTS.md — AstroLauncher

Guia completo para agentes de IA antes de qualquer edição neste repositório. Leia inteiro. Ignorar regras pode reprovar a revisão ou algum check obrigatório.

## 0. TL;DR (leia primeiro)

Este documento tem 3 tipos de informação: **[MUST]** obrigatório (violar = código incorreto), **[SHOULD]** seguir sempre que possível, **[REFERENCE]** explica o projeto (não é regra).

**🚨 PARE antes de escrever código.** Antes da primeira edição, confirme mentalmente:

- [ ] Procurei implementação semelhante?
- [ ] Estou seguindo o fluxo da arquitetura (UI → services → `apiInvoke` → command → use case → domain → infra)?
- [ ] Minha alteração é local e proporcional ao problema?
- [ ] Vou reutilizar código existente em vez de criar?
- [ ] Vou criar algum arquivo desnecessário?

Se qualquer resposta for "não sei", leia as seções relevantes antes de editar (quick search abaixo).

**Antes de escrever qualquer código:**

1. Procure peça/implementação semelhante — assuma que já existe (filosofia LEGO, §6).
2. UI **nunca** chama `invoke()` direto — sempre `apiInvoke` via services.
3. Nunca fure o fluxo: UI → services → `apiInvoke` → command → use case → domain → infra (§5).
4. Reutilize componentes/use cases; criar algo novo é o último recurso.
5. Faça a **menor mudança possível** — não refatore, não modernize, não "limpe" o que parece inútil (§18).
6. Nunca crie tags/release manual, nunca commite secrets ou artefatos de build.
7. Rode `npm run lint` + `npm run build` + `npm run format:check` (+ `cargo clippy` se Rust) antes de entregar.

**Se uma regra abaixo contradizer o código real → o código vence.** Reporte a divergência; não "corrija" o código para bater com a doc. Detalhes numéricos (comandos, campos, migrations, versão) envelhecem — confira no código (§18).

### Índice

| Seção | Conteúdo                                                      |
| ----- | ------------------------------------------------------------- |
| 1–2   | Projeto, stack, configs                                       |
| 3     | Comandos + ambiente local                                     |
| 4     | Estrutura de pastas                                           |
| 5     | Arquitetura (camadas, fluxo, AppState, erros)                 |
| 6     | Filosofia LEGO (componentização)                              |
| 7     | Padrões do frontend                                           |
| 8     | Padrões do backend                                            |
| 9     | IPC e comunicação                                             |
| 10    | Padronizações (naming, regras, limites)                       |
| 11    | Persistência e armazenamento                                  |
| 12    | CI/CD (Quality Gate, release)                                 |
| 13    | Git e GitHub (workflow, commits, PR, releases)                |
| 14    | O que NÃO fazer (hard rules)                                  |
| 15    | Gotchas conhecidos                                            |
| 16    | Fluxo ponta-a-ponta de feature nova                           |
| 17–19 | Docs de referência, hierarquia de decisão, princípios mentais |

### Quick search

| Quero...                         | Vá para...                |
| -------------------------------- | ------------------------- |
| Adicionar feature                | §16 (fluxo ponta-a-ponta) |
| Criar componente                 | §6 (LEGO) + §7            |
| Criar comando Tauri              | §8 + §9 + §16             |
| Criar use case / repo / migração | §8                        |
| Criar store / service / tipo TS  | §7                        |
| Fazer release / bump de versão   | §13                       |
| Rodar CI / entender o gate       | §12                       |
| Saber o que NÃO fazer            | §14                       |
| Resolver conflito de decisão     | §18                       |

## 1. O que é o projeto

Launcher de Minecraft desktop (Windows) feito em **Tauri v2 + React 19**. Inspirado no PrismLauncher, com foco em clean architecture, estética moderna e manutenibilidade. Dois binários lógicos: frontend TypeScript (`src/`) e backend Rust (`src-tauri/`).

**Funcionalidades:**

- Gerenciamento de instâncias: criar, editar, excluir, organizar em pastas (drag & drop)
- TODAS as versões do Minecraft: releases, snapshots, alphas, betas, infdev, classic, indev
- Loaders: Fabric, Quilt, Forge, NeoForge, LiteLoader
- Contas offline (modo crackeado): múltiplas contas, reordenação, conta padrão
- Download automático: client jars, bibliotecas, assets (padrão Mojang SHA1)
- Runtimes Java: detecção do sistema ou download de JRE portátil (Adoptium Temurin)
- Playtime tracking: sessões, resumo por instância
- Mod Browser: busca/instalação de mods via Modrinth + CurseForge
- Modpacks: instalação de `.mrpack` e manifests CurseForge
- Editor de instância: notas (tiptap), mundos, servers.dat, screenshots, arquivos de config
- Ícones customizados: presets ou upload com recorte (react-easy-crop)
- Visualizador de skins 3D (skinview3d), fontes PlayerMC + MCStat
- Discord Rich Presence (backend Rust, sem SDK no frontend)
- AstroPack: exportação/importação de instâncias completas
- Console de log em tempo real, changelog in-app, auto-update (plugin-updater)
- Dual-window: `main` (app) + `splash` (360x420 frameless, checa updater, depois `invoke('finish_splash')`)

**Idioma:** UI, toasts, docs, commits e PR em **PT-BR**. Código (identificadores, mensagens de erro de domínio, comentários): **inglês** (comentários podem ser PT-BR na prática, mas documentam o _porquê_).

## 2. Stack

### Frontend (npm)

React 19, TypeScript ~6.0 (strict, `verbatimModuleSyntax`, `erasableSyntaxOnly`), Vite 8, Tailwind v4 (CSS-first, plugin `@tailwindcss/vite`), shadcn/ui (`components.json` → style `radix-nova`, pacote único `radix-ui` ^1.6, NÃO `@radix-ui/react-*` individuais), zustand 5, react-router-dom v7 (**HashRouter**), sonner (toasts), framer-motion, lucide-react, dnd-kit, tiptap + codemirror, skinview3d, react-easy-crop, react-resizable-panels, cmdk, next-themes, `@fontsource-variable/geist`.

### Backend (Rust, crate `astrolauncher`)

tauri 2.11 (plugins: dialog, fs, shell, clipboard-manager, updater, process, log), tokio (full), reqwest 0.13 (json, stream), rusqlite 0.40 **bundled**, thiserror + anyhow, parking_lot, chrono, uuid v4, mc-launcher-core 0.1.2 (Forge/NeoForge + launch command builder), mc_chat, sysinfo, cpal, discord-rich-presence, tracing (+ subscriber/appender), jsonwebtoken, sha1/sha2/md-5, zip, semver, regex, walkdir, tempfile, fs_extra, mockall + criterion (dev).

### Configs relevantes

- `components.json` — aliases shadcn: `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks`; baseColor neutral, cssVariables true, iconLibrary lucide. **Aliases são lei — não criar paths alternativos.**
- Alias TS/Vite: `@/*` → `./src/*`.
- `src-tauri/tauri.conf.json` — windows, bundle NSIS (PT-BR, installMode currentUser), updater, `plugins.env` (URLs externas), `plugins.discord` (clientId, logoAssetKey).
- `src-tauri/tauri.ci.conf.json` — override CI: `createUpdaterArtifacts: false` (build sem assinatura).
- `src-tauri/capabilities/default.json` — permissões dos plugins (core:default, dialog, fs, shell, clipboard-manager, updater, process). **Todo plugin precisa de capability.**

## 3. Comandos

| Comando                           | Uso                                               |
| --------------------------------- | ------------------------------------------------- |
| `npm run dev`                     | frontend só (Vite)                                |
| `npm run dev:tauri`               | app completo (com splash)                         |
| `npm run dev:tauri:fast`          | sem splash (`ASTRO_DEV_NO_SPLASH=1`)              |
| `npm run build`                   | `tsc -b && vite build`                            |
| `npm run lint`                    | ESLint (flat config)                              |
| `npm run format` / `format:check` | Prettier (semi off, singleQuote, plugin tailwind) |
| `npm run tauri build`             | build release Windows (NSIS)                      |

Rust (rodar em `src-tauri/`): `cargo fmt --all -- --check`, `cargo check --all-targets`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all`, `cargo doc --no-deps` (RUSTDOCFLAGS `-D warnings`).

**Obrigatório antes de entregar:** `npm run lint` + `npm run build` + `npm run format:check` + `cargo check`/`clippy` (se tocou Rust). Rodar prettier em todo arquivo editado.

### Ambiente local

- Node.js **20+** (CI usa Node 20 — rodar local na mesma major), Rust stable via rustup, WebView2 atual (Windows).
- Package manager é **npm, exclusivamente** — `npm ci` para instalar (há `package-lock.json`). NUNCA pnpm/yarn/bun; nunca criar lockfile de outro manager.
- Setup: `npm install` → `npm run dev:tauri` (splash) ou `npm run dev:tauri:fast` (sem splash). Rust compila automaticamente via Tauri — sem cargo manual para rodar.
- Para tocar Rust: rodar os comandos `cargo` em `src-tauri/` (workdir), não na raiz.

## 4. Estrutura de pastas

### Frontend (`src/`)

```
src/
├── App.tsx            # HashRouter + 4 rotas + mounts globais (Toaster, LaunchProgressDialog, CursorTooltip)
├── main.tsx           # entrada principal
├── splash-main.tsx    # entrada splash (2º entry Vite: splash.html)
├── components/
│   ├── ui/            # primitivas shadcn (kebab-case: button.tsx, dialog.tsx) + *-variants.ts (cva)
│   ├── common/        # reutilizáveis agnósticos de feature (PascalCase: PageHeader, EmptyState, SearchInput...)
│   ├── layout/        # Shell, TopBar, StatusBar, AccountDropdown, LaunchProgressDialog (PascalCase)
│   └── splash/        # SplashScreen
├── features/          # por domínio, sempre: components/ hooks/ services/ pages/ (+ lib/ opcional)
│   ├── instances/     # maior feature: create-instance/, edit-instance/ (subpastas de tabs)
│   ├── mods/          # SEM pages/ — usado cross-feature (InstalledContentTab)
│   ├── accounts/ skins/ settings/   # settings só tem services/
├── stores/            # zustand, kebab.store.ts + hook useXStore
├── hooks/             # só useDiscordPresence (resto mora nas features)
├── lib/               # utils kebab-case; NUNCA generic utils.ts gigante
├── types/             # centralizado, kebab-case, 1 entidade/arquivo, espelha DTOs Rust (escrito à mão)
└── data/              # dados estáticos (mc-icons.ts)
```

Rotas (HashRouter, inline em `App.tsx`): `/`, `/instances/new`, `/instances/:id/edit`, `/skins`. Settings/mods/console/etc. são dialogs/tabs, NÃO rotas.

### Backend (`src-tauri/app/`) — camadas DDD

```
presentation/  # commands/*_commands.rs (um por domínio, snake_case) + state/app_state.rs
application/   # use_cases/XxxUseCase.rs (CRUD) + XxxService.rs + dto/ (XxxDTO, CreateXxxInput) + mappers/
domain/        # entities/ (plain structs, sem serde), errors/ (thiserror), repositories/ (traits)
infrastructure/# sqlite/, downloader/, process/, minecraft/, modloader/, java/, modrinth/, curseforge/,
               # playermc/, mcstat/, discord/, filesystem/, config/
bootstrap/     # setup.rs — composition root (DI manual, única fonte de wiring)
```

Quirk: `app/` não tem `mod.rs` próprio — `src-tauri/src/lib.rs` conecta via `#[path = "../app/..."]`. Registro de comandos: todos devem ser registrados em `generate_handler!` na lib.rs (adicionar comando novo = criar no module certo + registrar no handler).

## 5. Arquitetura

### Princípios

Clean Architecture + Hexagonal (Ports & Adapters) + DDD Lite + Vertical Slice + **CQRS-lite por convenção** (leitura/escrita em structs separadas: `List*UseCase` vs `Create/Update/Delete*UseCase`, cada uma com único `execute()`; sem tipos Command/Query formais, sem event bus). Repository Pattern, DIP (domain define traits, infra implementa), composição sobre herança, fail fast, imutabilidade por padrão (`let` > `let mut`, `Arc` só quando necessário).

### Fluxo de dados (nunca furar)

```
React (features) → services/*.api.ts → apiInvoke() → #[tauri::command] → UseCase → Domain → Infrastructure
```

- UI **nunca** chama `invoke()` direto — sempre via `src/lib/api/client.ts` (`apiInvoke<T>(command, args?)`). Exceção aceita: `launch.store.ts` chama `apiInvoke` direto (não existe `launch.api.ts`).
- Commands Rust são finos: recebem input DTO → delegam ao use case → retornam DTO. Zero lógica de negócio no handler.
- Domain **nunca** depende de I/O (nenhum rusqlite/reqwest no domain). Repos síncronos (SQLite local, sem async); use cases async só quando tocam rede/processo.
- DIP: bootstrap injeta `Arc<dyn Repo>` nos use cases via `AppState` (managed state do Tauri).

### AppState (DI)

`src-tauri/app/presentation/state/app_state.rs` — struct plain com campos `pub` (um por use case/service — quantidade atual confira no código; inclui `playtime: Arc<PlaytimeService>` + `discord: DiscordRpcHandle`). Construtor `AppState::new(...)` recebe repos `Arc<dyn Trait>` + `reqwest::Client` + app_data_dir + discord ids (com `#[allow(clippy::too_many_arguments)]`). Commands acessam via `State<AppState>` (sync) ou `State<'_, AppState>` (async). Montado uma vez em `bootstrap/setup.rs::build_app_state()` chamado no `.setup()` da lib.rs.

### Estratégia de erros

| Camada            | Tipo de erro                                                                        |
| ----------------- | ----------------------------------------------------------------------------------- |
| Domain            | enums `thiserror` (`InstanceError`, `AccountError`, `FolderError`) — nunca `String` |
| Use cases         | `Result<T, DomainError>`                                                            |
| Launch/I/O pesado | `anyhow::Result`                                                                    |
| Commands          | achatam para `Result<T, String>` via `.map_err(\|e\| e.to_string())`                |

Mensagens dos enums de domínio em inglês (`#[error("Account '{0}' not found")]`); PT-BR fica nos toasts do frontend. `From` impls para conversão entre camadas; nunca propagar erro de infraestrutura para o domínio.

## 6. Filosofia LEGO (componentização — regra nº 1)

Tudo é peça de lego: **montar > criar**. Antes de escrever qualquer componente/hook/use case novo:

1. **Procure no repositório** se já existe peça equivalente (`ui/`, `common/`, features vizinhas, use cases, repositórios, serviços).
2. **Reuse primeiro, generalize depois**: componente só vira `common/` quando 2+ features usam; antes disso mora na feature.
3. **Hierarquia de composição**: `pages` compõem componentes de feature; features compõem `common/` + `ui/`; `common/` compõe `ui/`. Só `ui/` usa radix. Nunca componente de feature dentro de `ui/`.
4. **Coloque peças onde pertencem**: hook usado só por uma página → co-localizado (`pages/useX.ts` ou `components/useX.ts`). Hook compartilhado → `features/X/hooks/`. Só suba para `src/hooks/` se for global.
5. **Um componente, uma responsabilidade**. Paginação, filtro, busca, dialogs são peças separadas que se compõem — não monstrengos de 400 linhas.
6. **Sempre utilize as peças da casa**: não crie `Button` próprio, use `@/components/ui/button` (cva variants). Classes com `cn()` de `@/lib/utils`.
7. **Padrões de página**: página = shell fino; toda lógica num hook `useXPage()` que retorna objeto de state + handlers (props `onXxx`); dialogs recebem o objeto do hook inteiro (`<InstancesPageDialogs page={page} />`).

### Anti-padrões (ruim vs bom)

| Ruim                                           | Bom                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Componente → `invoke()` direto → SQLite        | Componente → store → `api.api.ts` → `apiInvoke` → command → use case → repository |
| `utils.ts`/`helpers.ts` gigante genérico       | `format.ts`, `instance-icon.ts`, `path_utils.rs` (contextuais)                    |
| `MinecraftService` fazendo tudo                | `VersionService`, `LaunchService`, `RuleService` (especializados)                 |
| Criar `Button` próprio                         | `@/components/ui/button` (cva variants)                                           |
| Monstro de 400 linhas com filtro+página+dialog | Peças separadas compostas (`SearchInput` + `Pagination` + dialogs controlados)    |

## 7. Padrões do frontend

### Componentes

- Props: `interface XProps` local (não exportada), destruturada com defaults. UI primitives = `React.ComponentProps<'x'> & VariantProps<typeof xVariants> & { asChild?: boolean }`, função declarada (não arrow), export nomeado.
- UI primitives: `data-slot="button"` (+ `data-variant`/`data-size`), cva em arquivo separado `*-variants.ts`, `Slot.Root` de `radix-ui` para asChild, `cn(buttonVariants({ variant, size, className }))`.
- Dialogs: controlados — `open: boolean` + `onOpenChange: (open: boolean) => void` + `onConfirm` + labels opcionais com defaults + `isPending`.
- `className?: string` mergeado com `cn()`.

### Stores (zustand, `src/stores/*.store.ts`)

- `create<XxxStore>((set, get) => ...)`, interface exportada antes, sem middleware, sem persist.
- State: dados + `isLoading: boolean` + `error: string | null`. Fetch errors → `set({ isLoading: false, error: String(err) })`. Mutation errors não capturados na store — sobem ao caller (hook captura + toast).
- Actions chamam `XxxAPI` direto; atualização otimista após await: `set((state) => ({ accounts: [...state.accounts, account] }))`.
- Reorder otimista: reordenar local via `get()` primeiro, depois `await XxxAPI.reorder(ids)`.
- Seletores derivados exportados do mesmo arquivo: `useDefaultAccount()`, `useSelectedInstance()`.
- Eventos Tauri: listener transiente dentro da action (unlisten no `finally`) ou persistente no módulo (`listen('instance://stopped', ...)`).

### Hooks e data fetching

**Sem TanStack Query** (docs citam, mas não está instalado). Fetch via hooks (`useEffect` + store action ou service) → actions do store → API services. Padrão de erro: `try/catch` → `toast.error('Falha ao X: ' + String(err))` (alguns handlers re-throw para o caller fechar dialog). Use `let cancelled = false` cleanup guard em effects assíncronos.

### Services de API (`features/*/services/*.api.ts`)

Objeto plain `XxxAPI` com métodos, cada um delegação de 1 linha:

```ts
export const AccountAPI = {
  list(): Promise<AccountDTO[]> {
    return apiInvoke<AccountDTO[]>('list_accounts')
  },
  create(input: CreateAccountInput): Promise<AccountDTO> {
    return apiInvoke<AccountDTO>('create_account', { input })
  },
  delete(id: string): Promise<void> {
    return apiInvoke<void>('delete_account', { id })
  },
}
```

- Naming: `list()` não `getAll()`; args: create/update → `{ input }`, id → `{ id }`, reorder → `{ orderedIds }`, multi-arg → `{ id, folderId }`.
- Sem tratamento de erro aqui — erros propagam.

### Types (`src/types/*.ts`)

Espelham DTOs Rust **à mão, sem codegen** (sem ts-rs/specta). `XxxDTO` (saída), `CreateXxxInput`/`UpdateXxxInput` (entrada), camelCase idêntico ao serde. **Mudou DTO backend → atualizar tipo TS manualmente.** Sem enums TS (union types); campos nullable → `string | null`.

### Estilo e tema

- Tailwind v4 CSS-first em `src/index.css`; variáveis oklch no `.dark` block; `index.html` hardcoda `class="dark"` — **não há ThemeProvider**; next-themes só alimenta o wrapper do sonner.
- Animação: framer-motion (usado com moderação). Ícones: lucide-react.
- Toasts: sonner direto (`toast.success/error/info`), mensagens PT-BR; `<Toaster />` montado global em App.tsx.

## 8. Padrões do backend

### Command (`presentation/commands/*_commands.rs`)

```rust
#[tauri::command]
pub fn list_accounts(state: State<AppState>) -> Result<Vec<AccountDTO>, String> {
    state.list_accounts.execute().map_err(|e| e.to_string())
}
```

snake_case verbo+substantivo (`create_instance`, `install_java_runtime`); input DTO por valor; `id: String` por valor depois `&id`; async quando rede/processo; eventos emitidos via `app.emit("launch://event", ...)`.

### Use case (`application/use_cases/XxxUseCase.rs`)

```rust
pub struct ListAccountsUseCase { repository: Arc<dyn AccountRepository> }
impl ListAccountsUseCase {
    pub fn new(repository: Arc<dyn AccountRepository>) -> Self { Self { repository } }
    pub fn execute(&self) -> Result<Vec<AccountDTO>, AccountError> {
        let accounts = self.repository.find_all()?;
        Ok(accounts.iter().map(account_mapper::to_dto).collect())
    }
}
```

PascalCase `XxxUseCase`, `new(repo)`, `execute(&self)`. Features maiores usam `XxxService` com vários métodos (PlaytimeService, ModManagerService, ModBrowserService, ModpackInstallerService, AstroPackService, CustomIconService, SkinBrowserService, InstanceWorkspaceService, SettingsService).

### DTO (`application/dto/`)

Saída: `#[derive(Debug, Clone, Serialize)]` + `#[serde(rename_all = "camelCase")]`. Entrada: `#[derive(Debug, Clone, Deserialize)]` + serde. Assimetria é intencional. Nullable → `Option<String>`.

### Mapper (`application/mappers/`)

Free functions (módulo, não struct): `pub fn to_dto(entity: &Entity) -> XxxDTO` — cópia campo a campo. Só direção entity → DTO.

### Entity (`domain/entities/`)

`#[derive(Debug, Clone, PartialEq)]`, sem serde, campos pub, construtores com lógica de domínio (uuid v4, defaults):

```rust
pub fn new_offline(username: String, position: i64) -> Self {
    Self { id: uuid::Uuid::new_v4().to_string(), ..., created_at: chrono::Utc::now().to_rfc3339() }
}
```

Entidades existentes: `Instance`, `Account`, `Folder`, `InstalledMod`, `PlaytimeSession`. Mods/modpacks/java/skins/astropack/settings/workspace NÃO têm entidade — direto na application layer sobre filesystem/HTTP.

### Repositório (`domain/repositories/` + `infrastructure/persistence/repositories/`)

```rust
pub type Result<T> = std::result::Result<T, AccountError>;
pub trait AccountRepository: Send + Sync {
    fn find_all(&self) -> Result<Vec<Account>>;
    fn find_by_id(&self, id: &str) -> Result<Account>;
    fn save(&self, account: &Account) -> Result<()>;
    fn delete(&self, id: &str) -> Result<()>;
    fn set_default(&self, id: &str) -> Result<()>;
    fn reorder(&self, ordered_ids: &[String]) -> Result<()>;
}
```

Trait: `XxxRepository`; impl: `SqliteXxxRepository` sobre `Arc<Mutex<Connection>>` compartilhada (parking_lot). Síncronos. Padrões: `const SELECT_COLUMNS: &str` + `format!`, `map_row(row)` com `row.get("column")`, bool via `row.get::<_, i64>("x")? != 0`, erros → `XxxError::Persistence(e.to_string())`, NotFound via `.optional()?.ok_or_else(...)`, upsert `INSERT ... ON CONFLICT(id) DO UPDATE`, transações `unchecked_transaction()`. Domínio nunca importa rusqlite. 5 repos ativos (instance/folder/account/mod/playtime) — `InstanceError` reaproveitado para mods e playtime.

### Migrações (`infrastructure/persistence/migrations/`)

Registro function-pointer: `(u32, fn(&Connection) -> rusqlite::Result<()>)`, tabela `meta` (`schema_version`). Cada arquivo: `pub const VERSION: u32` + `pub fn up(conn: &Connection)`. Versões atuais (v1–v6 na data desta doc) vivem no array de `migrations/mod.rs` — confira lá antes de assumir. Rodam em transação no bootstrap, antes de qualquer repositório. Migração nova = arquivo `v{n}_nome.rs` + entrada no array. **NUNCA editar migração já aplicada** (usuários com DB no schema N+1 quebrariam) — mudou schema → criar `v{n+1}`.

### Bootstrap (`bootstrap/setup.rs`)

`build_app_state(app_data_dir, discord_client_id, discord_logo_asset_key)` — abre SQLite (`<app_data_dir>/data/launcher.db`, `.expect()` em falha é OK), roda migrations, monta 5 repos `Arc<dyn Trait>`, `reqwest::Client` com User-Agent `AstroLauncher/0.1.0` e connect timeout 10s (sem timeout total — downloads grandes), fecha sessões de playtime órfãs (recovery de crash), monta AppState.

## 9. IPC e comunicação

### Comandos (todos registrados no `generate_handler!` da lib.rs)

| Arquivo                          | Domínio                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `instance_commands.rs`           | `list/create/update/delete_instance`, `move_instance_to_folder`, `reorder_instances`                                                      |
| `folder_commands.rs`             | `list/create/update/delete_folder`, `reorder_folders`                                                                                     |
| `instance_workspace_commands.rs` | 22: log, notas, config files, mundos, servers, screenshots                                                                                |
| `minecraft_commands.rs`          | `list_minecraft_versions`, `launch_instance`, `stop_instance`, `cancel_launch`, `get_total_system_memory_mb`, `list_audio_output_devices` |
| `account_commands.rs`            | 6: CRUD + `set_default_account`, `reorder_accounts`                                                                                       |
| `mod_commands.rs`                | 11: busca, versões, projeto, instalar, listar, habilitar, excluir, modpacks                                                               |
| `skin_commands.rs`               | `search_skins`, `get_skin`, `download_skin`, `fetch_skin_texture_base64`                                                                  |
| `astropack_commands.rs`          | `preview_astropack`, `get_astropack_export_summary`, `export_instance`, `import_astropack`                                                |
| `playtime_commands.rs`           | `get_playtime_summary`                                                                                                                    |
| `settings_commands.rs`           | `get_settings`, `update_settings`                                                                                                         |
| `discord_commands.rs`            | `discord_set_presence`                                                                                                                    |
| `custom_icon_commands.rs`        | `list_custom_icons`, `save_custom_icon`, `delete_custom_icon`                                                                             |
| `splash_commands.rs`             | `finish_splash`                                                                                                                           |

### Eventos (namespace `://`, não `:`)

| Evento               | Direção            | Descrição                                                                              |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `launch://event`     | Backend → Frontend | Progresso/estágios do launch (payload = union discriminada `stage`/`progress`/`error`) |
| `instance://stopped` | Backend → Frontend | Instância/processo encerrou                                                            |
| `modpack://event`    | Backend → Frontend | Progresso de instalação de modpack                                                     |
| `astropack://event`  | Backend → Frontend | Progresso de import/export AstroPack                                                   |

Frontend escuta com `listen()` de `@tauri-apps/api/event`, tipado `listen<LaunchEvent>`.

**Args IPC:** Tauri converte camelCase do JS → snake_case do Rust automaticamente (`{ orderedIds }` chega como `ordered_ids`). Nomes de args Rust = snake_case; JS envia camelCase.

### Plugins frontend diretos

`plugin-dialog` (openFileDialog), `plugin-process` (relaunch), `plugin-updater` (check/downloadAndInstall), `plugin-clipboard-manager`, `plugin-shell`, `plugin-fs` — todos precisam de permission em `capabilities/default.json`.

## 10. Padronizações

### Naming

| Item                            | Convenção                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| Arquivos TS                     | kebab-case (`instance.api.ts`), componentes PascalCase (`PageHeader.tsx`), stores `kebab.store.ts` |
| Componentes/use cases/entidades | PascalCase (`ListInstancesUseCase`, `Instance`, `PageHeader`)                                      |
| Arquivos Rust                   | snake_case (`instance_commands.rs`, `sqlite_instance_repository.rs`)                               |
| Comandos Tauri / funções Rust   | snake_case verbo+substantivo (`create_instance`, `install_java_runtime`)                           |
| Comandos IPC (frontend)         | snake_case idêntico ao Rust (`'list_instances'`)                                                   |
| DTOs                            | `XxxDTO` (saída) / `CreateXxxInput` / `UpdateXxxInput`; serde `rename_all = "camelCase"`           |
| Trait de repositório            | `XxxRepository`, impl `SqliteXxxRepository`, alias `pub type Result<T> = ...XxxError`              |
| APIs TS                         | objeto `XxxAPI`, métodos verbo sem prefixo (`list()`, `create()`)                                  |
| Stores                          | `create<XxxStore>`, hook `useXxxStore`, seletores `useDefaultAccount()`                            |
| Variáveis CSS                   | oklch, vars no `.dark` block em `index.css`                                                        |

### Regras de código

- **TS strict**: `verbatimModuleSyntax` (use `import type`), `noUnusedLocals/Parameters`, `erasableSyntaxOnly` (sem enums TS — usar union types). Sem `any` (type-coverage é informativo, mas não regrida).
- **Prettier manda no estilo** — não brigue com o formatador. Sem ponto-e-vírgula, aspas simples. `cargo fmt` no Rust (indent 4).
- **Comentários**: explicam o _porquê_, nunca o _quê_. Código autoexplicativo. Exemplo bom: `// Mojang retorna 403 se não enviarmos User-Agent`. Exemplo ruim: `// Soma o total de downloads completados`. Ideal: inglês (backend segue isso); JSDoc/comentários PT-BR vistos no frontend são aceitos.
- **Utilitários contextuais**: nunca `utils.rs`/`helpers.ts`/`common.ts` genéricos — `path_utils.rs`, `format.ts` sim.
- **Services especializados**: nunca `MinecraftService` — `VersionService`, `LaunchService`, `RuleService`.
- **Imutabilidade**: `let` por padrão; `Arc`/`Mutex` só quando necessário; `Arc<dyn Repo>` para DI.
- **Imports**: `@/` para tudo; relativo (`../`) só dentro da mesma feature.
- **Erros**: domain = thiserror enums; use cases `Result<T, DomainError>`; launch/I/O `anyhow::Result`; commands `Result<T, String>`.
- **Markdown** (novo `.md`): markdownlint com `default: true`, desabilitados MD013 (linha longa), MD041 (h1 na 1ª linha), MD033 (HTML inline), MD040 (code block sem lang), MD051 (âncora emoji), MD034 (URL crua), MD024 `siblings_only`; tabelas estilo padded (prettier formata).
- **knip** (dead-code): entry `src/splash-main.tsx`, projeta `src/**`, ignora `src/components/ui/**`; ignoreDependencies: tailwindcss, `@fontsource-variable/geist`, `@tailwindcss/typography`, shadcn, cmdk, tailwindcss-animate, tw-animate-css. Adicionou entry novo (ex.: nova janela Vite) → atualizar `knip.json`.

### Limites de tamanho (docs/05, enforce)

| Artefato     | Máx          | Ideal  |
| ------------ | ------------ | ------ |
| Arquivo      | 200 linhas   | 80–150 |
| Função       | 30 linhas    | 10–20  |
| Struct       | 5–7 campos   | 3–5    |
| Enum de erro | 10 variantes | 3–7    |

Passou disso → quebre em peças menores (lego!). Exceção conhecida: `launch_instance.rs` (533 linhas, orquestração pesada) — não é desculpa para criar outros.

### Testes

Rust: unidade para regras de domínio, use cases com repos mockados (`mockall`), integração para infra. Domínio nunca toca I/O. Benchmarks: criterion. Frontend: sem suíte de testes configurada (não adicionar test runner sem necessidade real — gate não exige).

**Localização dos unit tests:** o corpo dos testes de unidade fica em arquivo separado numa subpasta `tests/` ao lado do fonte; o arquivo-fonte só declara `#[cfg(test)] #[path = "tests/<nome>_tests.rs"] mod tests;` (o test file usa `use super::*;`, acessa internals normalmente). Mantém o arquivo de lógica limpo. Padrão aplicado em `domain/entities/`, `application/mappers/`, `infrastructure/modloader/forge_like`. Novo unit test → siga esse layout, não deixe `mod tests { ... }` inline.

## 11. Persistência e armazenamento

- **SQLite** (rusqlite bundled): `<app_data_dir>/data/launcher.db` (via resolver do Tauri, não crate `dirs`). Sem ORM, SQL raw, repos síncronos.
- Tabelas v1: `instances`, `folders`, `playtime_sessions`, `accounts`, `instance_mods`, `installed_modpacks`, `meta`. Migrações v2–v6 = ALTER TABLE (`position`/`is_default` em accounts, `icon_url`/`kind` em instance_mods, `position` em instances, `icon_path` em folders). `installed_modpacks` existe mas sem repositório no domínio.
- **settings.json** (único JSON, `<app_data_dir>/settings.json`): só 3 campos — `curseforge_api_key`, `root_group_name`, `root_group_icon`. NÃO adicionar `theme`/`minecraft_dir` etc. (schema antigo de docs).
- **Filesystem**: instâncias/notas/screenshots/mundos/icons em `<app_data_dir>` (paths via `infrastructure/filesystem/paths.rs` — path-joining puro, sem I/O). Assets Mojang por hash SHA1. Java portátil em `<app_data_dir>/java/<major>/`.
- **Sem cache em nada**: manifests, buscas de mods, skins batem nas APIs externas toda vez (lacuna conhecida, não decisão de design).
- CurseForge precisa de `CURSEFORGE_API_KEY` (env de build ou settings.json).

### Schema SQLite (v1, verbatim)

```sql
CREATE TABLE instances (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    version     TEXT NOT NULL,
    loader      TEXT,             -- 'fabric'|'quilt'|'forge'|'neoforge'|'liteloader'|NULL
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

CREATE TABLE folders (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    collapsed   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE playtime_sessions (
    id          TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    started_at  TEXT NOT NULL,
    ended_at    TEXT,
    duration_seconds INTEGER DEFAULT 0
);

CREATE TABLE accounts (
    id          TEXT PRIMARY KEY,
    username    TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'offline',
    uuid        TEXT,
    last_used   TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE instance_mods (
    id          TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE,
    mod_id      TEXT NOT NULL,
    source      TEXT NOT NULL,    -- 'modrinth'|'curseforge'
    name        TEXT NOT NULL,
    version     TEXT NOT NULL,
    file_path   TEXT NOT NULL,
    enabled     INTEGER NOT NULL DEFAULT 1,
    installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE installed_modpacks (
    id          TEXT PRIMARY KEY,
    instance_id TEXT NOT NULL REFERENCES instances(id) ON DELETE CASCADE UNIQUE,
    source      TEXT NOT NULL,
    project_id  TEXT NOT NULL,
    project_name TEXT NOT NULL,
    project_version TEXT NOT NULL,
    installed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

v2–v6 = ALTER TABLE: `accounts` + `position`/`is_default`; `instance_mods` + `icon_url` (v3), + `kind` `'mod'|'resourcepack'|'shader'` (v4); `instances` + `position` (v5); `folders` + `icon_path` (v6). IDs sempre uuid v4 string; timestamps RFC3339; booleans como INTEGER 0/1; NULLs → `Option<T>`/`string | null`.

## 12. CI/CD (Quality Gate)

`.github/workflows/quality-gate.yml` (name: **Testes**) — roda em push para `main`, tags `v*`, todo PR e `workflow_dispatch`. 3 jobs paralelos; nenhum bloqueia merge por gate formal (revisão de PR fica no CodeRabbit). Mantenha tudo verde. Review de PR = CodeRabbit (`.coderabbit.yaml`), não há mais Sonar/Codecov/CodeQL/coverage no CI.

| Job           | O que roda                                                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend`    | ESLint, Prettier check, `tsc -b --noEmit` (fallback `tsc --noEmit`), `npm run build`, knip (`--no-exit-code`, dead-code informativo)                              |
| `rust`        | fmt check, `cargo check --all-targets`, clippy `-D warnings` (pega dead_code/unused), `cargo test --all`, doc com RUSTDOCFLAGS `-D warnings`                      |
| `tauri-build` | Windows: `npm run tauri build -- --bundles nsis --config src-tauri/tauri.ci.conf.json` (sem updater artifacts → sem chave de assinatura) + verifica `.exe` gerado |

### Release build (`.github/workflows/build.yml`)

Manual (`workflow_dispatch`), Windows: instala WebView2, valida `TAURI_PRIVATE_KEY_FILE` (base64, deve começar com `untrusted comment: rsign encrypted secret key`), builda com assinatura (secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` + `CURSEFORGE_API_KEY`), lê versão do `tauri.conf.json`, release notes de `.github/releases/<tag>.md` (fallback `_template.md`), gera manifest do updater (`latest.json`), cria tag `v<versão>` e publica GitHub Release com NSIS exe + manifest.

**Secrets usados no CI:** `GITHUB_TOKEN`, `TAURI_PRIVATE_KEY_FILE`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, `CURSEFORGE_API_KEY` (todos no `build.yml`; o workflow de testes não usa secrets).

**CodeRabbit** (`.coderabbit.yaml`): language pt-BR, profile assertive, exclui locks/node_modules/target/dist; markdownlint, gitleaks, eslint, clippy habilitados; ruff desligado.

## 13. Git e GitHub

### Workflow

**Regra de ouro: NUNCA commitar/pushar direto na `main`.** Todo código entra via Pull Request — a main só recebe merges de PR (CodeRabbit revisa cada PR). Exceções: releases (build.yml cria tag/Release via CI manual) e bots (Dependabot já abre PRs).

1. Fork → clone → `git remote add upstream https://github.com/kauafpssx/AstroLauncher.git`
2. Branch com prefixo: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/` (a partir de `main` atualizada)
3. Commits conventional, pequenos, um propósito cada
4. PR contra `main` (template obrigatório); se `main` avançou: `git fetch upstream && git rebase upstream/main` (rebase, não merge)
5. Esperar o Quality Gate rodar no PR; manter report verde antes de mergear
6. Merge do PR → CI roda na main e, se for tag `v*`, também

### Commits (Conventional Commits)

Formato: `<tipo>(<escopo>): <descrição>` — tipos `feat|fix|refactor|perf|style|docs|test|build|ci|chore|revert`. Descrição ≤72 chars. Corpo explica o **porquê**. Footer: `BREAKING CHANGE:` / `Closes #n`. Escopos usados: instances, mods, accounts, java, ipc, readme... Template em `.gitmessage` (`git config commit.template .gitmessage`).

### PR

Template com: Descrição (o quê/porquê), Mudanças (checkboxes), Checklist (branch atualizada, padrões do projeto — ≤200 linhas/arquivo, thiserror, código em inglês, lint passou, build passou, testado, release notes atualizados se necessário), Evidências opcionais, Issues relacionadas (`Closes #42`). **Um PR, uma mudança** — PRs focados revisam rápido; gigantes demoram e o CodeRabbit/Quality Gate ficam ruidosos.

### Issues

Bug report: título `bug:`, label `bug` — versão do launcher, SO, loader, versão MC, descrição, passos, logs, confirmação de busca prévia. Feature: `feat:`, label `enhancement` — problema/motivação, solução, alternativas. Blank issues desabilitados. Segurança: NUNCA issue pública — `SECURITY.md` (advisory privado, resposta em 7 dias, só última versão recebe fix pre-1.0).

### Releases

`.github/releases/vX.Y.Z.md` — criar/atualizar ao mexer em comportamento visível. Estrutura: Destaques / Correções de bugs / Novidades / Melhorias / Alterações gerais / Instaladores / Changelog. Placeholders `{{tag}}` `{{version}}` `{{changelog_url}}`; `_template.md` é o fallback.

**Versão (onde vive):** a versão existe em UM lugar só — `src-tauri/tauri.conf.json` (campo `version`). `package.json` é irrelevante (fica `0.0.0`). **Git tags `vX.Y.Z` NÃO são criados à mão** — o `build.yml` cria o tag automaticamente no momento do release (se o tag já existir, não recria). Bump de versão acontece ao iniciar o ciclo de release: 1) editar `version` no `tauri.conf.json`; 2) criar `.github/releases/vX.Y.Z.md`; 3) disparar `build.yml` manualmente → CI taggeia `vX.Y.Z` e publica Release. Nunca criar tag manual nem commitar `.latest.json` (manifest é gerado no CI).

### Outros

- Dependabot: npm (semanal, grupos tauri/react, prefixo `chore(deps)`), cargo (semanal), github-actions (mensal). Não crie PRs de dependência manualmente sem necessidade real.
- CODEOWNERS: `* @kauafpssx`.
- `.git-blame-ignore-revs`: commits de formatação vão aqui (ainda vazio, template no header).
- `.gitattributes`: LF para código, CRLF para ps1/bat/cmd; `package-lock.json`/`Cargo.lock`/`dist`/`src-tauri/gen` marcados linguist-generated.
- Chaves de assinatura do updater **nunca** são commitadas (`.gitignore` protege `.keys`, `*.key`, `*.sig`).

## 14. O que NÃO fazer (hard rules)

- ❌ Criar componente/hook/use case duplicado sem procurar antes.
- ❌ `invoke()` direto em componente; ❌ `apiInvoke` sem tipagem genérica.
- ❌ Arquivos `utils.ts`/`helpers.ts`/`common.ts` genéricos — utils são contextuais.
- ❌ Services gigantes (`MinecraftService`) — especializados.
- ❌ Enums TS (`erasableSyntaxOnly`); ❌ `any`; ❌ imports/exports não usados (knip falha).
- ❌ Async em repositório SQLite (convenção: síncrono, `Arc<Mutex<Connection>>`).
- ❌ Furar camada DDD (UI→Infrastructure direto).
- ❌ Mexer em `components/ui/` manualmente — só via CLI shadcn.
- ❌ `@tauri-apps/api` desatualizado ou plugin sem permission em `capabilities/default.json`.
- ❌ Commit sem Conventional Commits (CI valida regex).
- ❌ Adicionar dependência sem necessidade real (audit + outdated no gate).
- ❌ Commit de secrets/chaves de assinatura.
- ❌ Commit de artefatos de build: `dist/`, `src-tauri/target/`, `src-tauri/gen/`, `node_modules/`, `.tsbuildinfo` (jobs `files`/gitignore pegam).
- ❌ Editar migração já aplicada (v1–v6) — criar `v{n+1}`.
- ❌ Seguir `presentation/ipc/instance.rs` — layout legado paralelo, não usar.
- ❌ Adicionar `theme`/`minecraft_dir`/etc. ao settings.json — schema mínimo é lei.
- ❌ **[MUST] Deixar janela de console (cmd/PowerShell/terminal) vazar, piscar ou aparecer na tela do usuário.** Todo processo externo (Java/Minecraft, comandos de sistema, qualquer `std::process::Command` no Windows) SEMPRE roda de forma interna/suprimida — janela oculta, nunca visível. No Windows: aplicar `CREATE_NO_WINDOW` (`0x08000000`) via `.creation_flags(...)` (`std::os::windows::process::CommandExt`) em TODO `Command` que spawna processo. Nenhuma exceção — nem em launch, download, java, nem em helpers.

## 15. Gotchas conhecidos

- **Sem TanStack Query** (docs e CONTRIBUTING citam, mas não está instalado) — fetch via hooks → actions do store zustand → API services.
- **Sem cache em nada**: manifests, buscas de mods, skins batem nas APIs externas toda vez (APIs configuradas em `plugins.env` do `tauri.conf.json`, expostas via `get_app_env_config`).
- CurseForge precisa de `CURSEFORGE_API_KEY` (env build ou `settings.json`).
- Theme: `index.html` hardcoda `class="dark"`; next-themes só alimenta o wrapper do sonner. Não há ThemeProvider.
- Stores zustand: sem middleware persist; seletores derivados exportados do mesmo arquivo (`useSelectedInstance()`).
- `data-slot` nas primitivas shadcn; variantes cva separadas em `*-variants.ts`.
- `reqwest-retry` está no Cargo.toml mas NÃO é usado — não assuma retry no downloader.
- `npm run tauri build` local exige chave de assinatura do updater (artifacts) — sem chave, usar `--config src-tauri/tauri.ci.conf.json` (desliga signing, igual ao CI).
- Assets estáticos ficam em `public/` (logos); obsoletos vão para `public/_unused/` em vez de serem deletados.
- Forge/NeoForge launch usa `mc_launcher_core::command::builder::build_launch_command`, não `process/launcher.rs`.
- **Janela de console nunca vaza** (ver §14): todo `Command` no Windows leva `CREATE_NO_WINDOW` (`0x08000000`) via `.creation_flags()`. Sem isso, cmd/PowerShell pisca na tela ao spawnar processo. Novo ponto de spawn = replicar o flag.
- AppState concentra use cases + services (quantidade atual confira no código); contagens citadas em docs antigos (29 campos, 74 comandos) estão defasadas — a verdade vive no código.
- `launch.store.ts` chama `apiInvoke` direto (sem `launch.api.ts`) — exceção aceita ao padrão de services.
- `npm run dev` (Vite puro) NÃO tem backend Tauri — chamadas `apiInvoke` e plugins falham; desenvolvimento real = `dev:tauri`/`dev:tauri:fast`.
- React 19 StrictMode roda effects 2x em dev — `let cancelled` guard cobre isso; não é bug.
- User-Agent do reqwest definido no bootstrap (atualmente `AstroLauncher/0.1.0`); connect timeout 10s, sem timeout total.
- Sessões de playtime órfãs (crash) são fechadas no bootstrap — não duplicar essa lógica.
- Linha com 2+ padrões conflitantes → seguir código real existente + docs/05 (source of truth das regras) e reportar no AGENTS.md.

## 16. Fluxo de trabalho: adicionar uma feature ponta-a-ponta

Ordem recomendada (backend → frontend) para feature nova com comando Tauri:

**Backend (Rust):**

1. Procurar use case/service existente que resolva — só criar se não houver.
2. Domain: entidade nova (se precisar persistir) + erro thiserror + trait de repositório.
3. Infrastructure: impl SQLite (`sqlite_xxx_repository.rs`) + migração `v{n}_xxx.rs` (registrar no array de `migrations/mod.rs`).
4. Application: `XxxUseCase.rs` (ou método em `XxxService.rs`), DTO em `dto/` (Serialize saída / Deserialize entrada, `rename_all = "camelCase"`), mapper se entity → DTO.
5. Presentation: comando em `commands/*_commands.rs` (snake_case) → registrar em `generate_handler!` na lib.rs → campo no `AppState` se usar state.
6. Bootstrap: injetar repo `Arc<dyn Trait>` no `build_app_state()`.

**Frontend (TS):** 7. Tipo no `src/types/` espelhando o DTO (camelCase idêntico — mão, sem codegen). 8. Método no `features/X/services/xxx.api.ts` via `apiInvoke<T>('nome_do_comando', { args })`. 9. Store zustand (se estado global) ou hook de feature (se local) → componentes `ui/` → `common/` → feature → página (`useXPage()`).

**Verificação:** `npm run lint` + `npm run build` + `npm run format:check` + `cargo check`/`clippy` + prettier nos arquivos editados. Se mexeu em comportamento visível: release notes `.github/releases/vX.Y.Z.md`.

## 18. Hierarquia de decisão (fonte da verdade)

**Princípios mentais (bússolas de decisão):**

| Princípio               | Regra mental                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 🧱 LEGO                 | Montar antes de criar — peça nova é o último recurso                                                           |
| 🔬 Cirurgião            | Incisão de 2 cm, não remover o órgão — alteração local, reversível, proporcional                               |
| 🏛️ Arqueólogo           | Descubra por que o código existe antes de tocá-lo — código estranho ≠ código errado                            |
| 🎲 Dominó               | Toda mudança de contrato (API pública, command IPC, DTO, entidade) derruba consumidores — identifique-os antes |
| 🌍 Gravidade            | Corrija perto da origem — quanto mais longe do bug, maior o risco de efeito colateral                          |
| 🚒 Bombeiro             | Apague o incêndio, não reforme o prédio                                                                        |
| ⚖️ Menor Surpresa       | Código novo deve parecer que sempre esteve no projeto — ninguém distingue o que foi escrito hoje               |
| 🪨 Inércia Arquitetural | Arquitetura só muda com ganho concreto que justifique o custo, nunca por moda/biblioteca melhor                |
| 🧠 Economia Cognitiva   | Abstração, camada, helper e componente têm custo — só criar quando o benefício superar claramente              |
| 🔍 Já Existe            | Antes de escrever qualquer código, assuma que ele já existe — procure primeiro, crie depois                    |
| 🪞 Simetria             | Feature nova copia o formato exato das vizinhas (dto/service/mapper/repository/commands)                       |
| 🛡️ Conservação          | Código não usado agora ≠ morto — registros, IPC, DI, geração; na dúvida, preserve                              |

**Fonte da verdade é o código real, não a documentação.** O AGENTS.md e os docs descrevem a arquitetura esperada; se o código existente contradiz qualquer documentação, siga o código e reporte a divergência. Docs antigos têm números defasados (AppState 30 campos, 73 comandos, TanStack Query citado mas não instalado) — não "corrija" o código para bater com docs velhos.

**Antes de criar qualquer código, nesta ordem:**

1. Procure implementação semelhante no repositório — não só pelo nome: busque por comando parecido, componente parecido, use case parecido, repository parecido, service parecido.
2. Reutilize sempre que possível; generalize só quando 2+ pontos precisarem.
3. Se não existir, siga exatamente o padrão da feature/camada vizinha.
4. Só introduza padrão novo quando realmente necessário — e reporte no AGENTS.md.

**Stop conditions (pare e pergunte ao humano antes de prosseguir):**

- Precisar alterar a arquitetura (camadas, fluxo, convenções CQRS-lite, sync repos).
- Precisar mudar contrato público (API pública, command IPC, DTO, entidade) sem mapear todos os consumidores.
- Precisar adicionar dependência nova (npm/cargo) — procure solução existente primeiro.
- Precisar editar migração já aplicada (v1–v6) — a resposta é sempre `v{n+1}`.
- Precisar remover código sem saber o impacto (registros, IPC, DI, geração).
- Precisar criar arquivo novo quando algo parecido já existe.

**Diff philosophy:**

- O melhor PR é o menor PR: `+20/-5` vence `+400/-380` quando ambos resolvem o mesmo problema.
- Se editou 5 linhas, o diff ideal contém só essas 5 linhas — sem reformatação, sem reordenação de imports, sem limpeza no caminho.

**Antes de modificar código:**

1. Leia o arquivo alvo; depois quem o chama; depois quem ele chama — só então altere (evita mudança isolada sem contexto).
2. Entenda o fluxo atual e o porquê do estado atual.
3. Faça a menor alteração possível que resolva o problema.
4. Preserve consistência com a feature existente — não aproveite a tarefa para "melhorar" o que não é o problema.
5. Nunca reescreva arquivo inteiro — edite só o necessário; preserve comentários, ordem de imports e estilo do arquivo.

**Modernização espontânea (proibida):**

- Não atualize APIs só porque existe versão mais moderna; não substitua bibliotecas; não migre padrões. A tarefa é resolver o problema solicitado — "já aproveitei para trocar..." não é aceitável.
- Se mexer numa API pública: preserve compatibilidade quando possível; caso contrário documente `BREAKING CHANGE` no commit/PR.

**Remover código (critério):**

- Nunca remova código aparentemente "não usado" sem verificar: exports, comandos IPC, registros em `generate_handler!`, AppState, migrations, geração de código. Editor/IDE marcou como unused ≠ está morto.

**Comentários:**

- Comentários existentes documentam decisões anteriores — não remova comentários arquiteturais sem entender o propósito deles.

**Abstrações:**

- Não abstraia código usado apenas uma vez; duplicação pequena é preferível a abstração prematura.
- Só generalize quando 2+ pontos de uso reais existirem (ver regra nº 1 da Filosofia LEGO).

**Impacto mínimo:**

- Sempre prefira mudanças locais; evite alterar APIs públicas, nomes ou arquitetura quando o problema puder ser resolvido dentro da própria feature.
- Mudanças proporcionais ao problema: tarefa de 10 linhas não reorganiza metade do projeto.

**Exceções a regras:**

- Regras existem para casos normais; quando uma exceção for realmente necessária: documente o porquê, mantenha consistente com o entorno e explique no PR — não quebre silenciosamente.

**Dependências novas:**

1. Verifique se o repo já tem dependência/peça que resolve (knip/audit pegam de qualquer jeito).
2. Prefira código próprio para problemas pequenos — bibliotecas têm custo de manutenção e licença.
3. Justifique dependência nova no PR (audit + outdated + cargo deny no gate).

**Refatoração:**

- Não refatore código apenas por preferência estética.
- Não altere estilo arquitetural (camadas, convenções CQRS-lite, sync repos) — para mudar arquitetura, discuta antes em issue/PR separado.
- Não renomeie arquivos/símbolos sem necessidade real.
- Mudanças proporcionais ao problema: tarefa de 10 linhas não reorganiza metade do projeto.

**Resolução de conflito de decisão, em ordem de prioridade:**

1. Hard rules (seção 14)
2. Arquitetura do projeto (seções 5–8)
3. Código já existente (a fonte de verdade)
4. Convenções de naming (seção 10)
5. Preferências pessoais (menor prioridade — siga o padrão do repo)

**Check mental antes de considerar a tarefa concluída:**

- [ ] Segui a arquitetura e o fluxo de dados (UI → apiInvoke → command → use case)?
- [ ] Reutilizei peças existentes em vez de criar duplicadas?
- [ ] Mantive o padrão da feature/camada vizinha?
- [ ] A alteração é a menor possível para o problema?
- [ ] Nenhuma hard rule (§14) foi violada?
- [ ] Não introduzi dependência nova sem justificativa?
- [ ] `npm run lint` + `npm run build` + `npm run format:check` (e `cargo clippy` se Rust) passaram?
- [ ] Nenhum documento (AGENTS.md, docs, release notes) precisa de atualização por causa da mudança?

## 19. Docs de referência

`docs/` (PT-BR) é a bíblia do projeto (12 documentos): `01-visao-geral.md`, `02-arquitetura.md`, `03-estrutura-de-pastas.md`, `04-modulos-e-dominios.md`, `05-padroes-e-boas-praticas.md` (regras detalhadas), `06-ipc-e-comunicacao.md`, `07-frontend.md`, `08-infraestrutura.md`, `09-evolucoes-futuras.md`, `10-glossario.md`, `11-dependencias-e-libs.md`, `12-armazenamento.md`. Contradição entre AGENTS.md e docs → seguir AGENTS.md (reflete o código real) e reportar. Contradição entre AGENTS.md e código → seguir o código e reportar (ver seção 18).
