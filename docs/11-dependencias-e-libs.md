# 11 — Dependências e Bibliotecas

## 11.1 Rust (Cargo.toml)

### Core

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `tauri` | 2.x | Framework desktop nativo |
| `tauri-plugin-dialog` | 2.x | Diálogos nativos (selecionar pasta/arquivo) |
| `tauri-plugin-fs` | 2.x | Acesso ao sistema de arquivos |
| `tauri-plugin-shell` | 2.x | Spawn de processos (Java) |
| `serde` | 1.x | Serialização/deserialização |
| `serde_json` | 1.x | JSON parsing |
| `thiserror` | 2.x | Erros tipados com `#[derive(Error)]` |
| `anyhow` | 1.x | Erros contextuais (apenas em infra/casos de uso) |
| `tokio` | 1.x | Runtime assíncrono (full features) |

### Minecraft

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `mc-launcher-core` | 0.2.x | Building blocks para launcher Minecraft |
| `mc-chat` | 0.2.x | Parsing de chat formatado do Minecraft |
| `uuid` | 1.x | Geração/parse de UUIDs (contas offline) |
| `mc-versions` | 0.1.x (ou custom) | Parsing de todos os tipos de versão (release, snapshot, alpha, beta, infdev, classic) |

### HTTP e Network

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `reqwest` | 0.12.x | Cliente HTTP (download de assets, manifests) |
| `reqwest-middleware` | 0.4.x | Middleware para reqwest (retry, logging) |
| `reqwest-retry` | 0.6.x | Retry automático com backoff |
| `zip` | 2.x | Extração de arquivos .jar e .zip |
| `flate2` | 1.x | Descompressão gzip (assets index) |

### Hash e Integridade

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `sha1` | 0.10.x | SHA-1 (checksum de assets Mojang) |
| `sha2` | 0.10.x | SHA-256/512 |
| `md-5` | 0.10.x | MD5 |
| `hex` | 0.4.x | Encoding hex para hashes |

### Sistema e Arquivos

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `dirs` | 6.x | Diretórios padrão do sistema (.minecraft, AppData) |
| `tempfile` | 3.x | Arquivos temporários para downloads |
| `walkdir` | 2.x | Iteração recursiva em diretórios |
| `fs_extra` | 1.x | Operações extras de filesystem (cópia, move) |
| `path-clean` | 1.x | Limpeza e normalização de paths |

### Processos

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `tauri-plugin-shell` | 2.x | Spawn e gerenciamento de processos |
| `sysinfo` | 0.32.x | Monitoramento de processos e sistema |

### Discord RPC

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `discord-rich-presence` | 0.3.x | Discord Rich Presence (RPC) |
| `discord-sdk` | 0.3.x (se disponível) | Alternativa para Discord SDK |

### Logging

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `tracing` | 0.1.x | Logging estruturado |
| `tracing-subscriber` | 0.3.x | Output de logs (console + arquivo) |
| `tracing-appender` | 0.2.x | Rolling file appender |
| `chrono` | 0.4.x | Timestamps para logs |

### APIs de Modpack

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `reqwest` | 0.12.x | Cliente HTTP para APIs (reutilizado) |
| `serde` | 1.x | Parsing das respostas JSON |

> **Nota:** CurseForge e Modrinth usam APIs REST sobre HTTP. Não há crate específica — usamos `reqwest` + `serde` para consumir as APIs diretamente.
>
> - **CurseForge Core API:** `https://api.curseforge.com/v1/` (requer API key)
> - **Modrinth API v3:** `https://api.modrinth.com/v3/` (pública, sem key)

### Playtime

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `chrono` | 0.4.x | Timestamps de início/fim de sessão |
| `serde` | 1.x | Serialização dos dados de playtime |

### Banco de Dados

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `rusqlite` | 0.31.x | SQLite com feature `bundled` (SQLite incluso no binário) |
| `rusqlite_migration` | 1.x | Migrações versionadas (opcional, podemos fazer manual) |

### Config e Armazenamento

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `toml` | 0.8.x | Config em TOML (alternativa ao JSON) |
| `jsonwebtoken` | 9.x | JWT (para auth futura) |

### Utilitários

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `once_cell` | 1.x | Lazy statics |
| `parking_lot` | 0.12.x | Mutex/RwLock mais performáticos |
| `crossbeam` | 0.8.x | Canais e estruturas concorrentes |
| `futures` | 0.3.x | Combinadores de futures |
| `itertools` | 0.14.x | Extensões de iteradores |
| `regex` | 1.x | Expressões regulares |
| `semver` | 1.x | Comparação de versões semânticas |

### Desenvolvimento (dev-dependencies)

| Biblioteca | Versão | Finalidade |
|-----------|--------|------------|
| `mockall` | 0.13.x | Mock de traits para testes |
| `tempfile` | 3.x | Diretórios temporários em testes |
| `criterion` | 0.5.x | Benchmarks |
| `tauri-plugin-mock` | 2.x | Mock para testes Tauri |

---

## 11.2 Frontend (package.json)

### Core

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `react` | 19.x | UI Library |
| `react-dom` | 19.x | Renderização DOM |
| `react-router-dom` | 7.x | Roteamento SPA |
| `typescript` | 5.x | Type safety |
| `vite` | 6.x | Bundler e dev server |
| `@vitejs/plugin-react` | 4.x | Plugin Vite para React |
| `@tauri-apps/api` | 2.x | API IPC Tauri (invoke, events) |
| `@tauri-apps/plugin-dialog` | 2.x | Diálogos nativos |
| `@tauri-apps/plugin-fs` | 2.x | Acesso a arquivos |
| `@tauri-apps/plugin-shell` | 2.x | Shell/processos |

### UI (shadcn/ui)

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `tailwindcss` | 4.x | Utility-first CSS |
| `@tailwindcss/vite` | 4.x | Plugin Tailwind para Vite |
| `tailwindcss-animate` | 1.x | Animações Tailwind |
| `postcss` | 8.x | Processador CSS |
| `autoprefixer` | 10.x | Prefixos CSS |
| `class-variance-authority` | 0.7.x | Variantes de classe (cva) |
| `clsx` | 2.x | Junção condicional de classes |
| `tailwind-merge` | 3.x | Merge inteligente de Tailwind classes |
| `lucide-react` | 0.400+ | Icones (shadcn/ui usa esse por padrão) |
| `radix-ui/*` | 1.x | Componentes headless acessíveis (shadcn/ui usa Radix) |

### Componentes Radix (usados pelo shadcn/ui)

```json
{
  "@radix-ui/react-accordion": "^1.x",
  "@radix-ui/react-alert-dialog": "^1.x",
  "@radix-ui/react-aspect-ratio": "^1.x",
  "@radix-ui/react-avatar": "^1.x",
  "@radix-ui/react-checkbox": "^1.x",
  "@radix-ui/react-collapsible": "^1.x",
  "@radix-ui/react-context-menu": "^1.x",
  "@radix-ui/react-dialog": "^1.x",
  "@radix-ui/react-dropdown-menu": "^1.x",
  "@radix-ui/react-hover-card": "^1.x",
  "@radix-ui/react-label": "^1.x",
  "@radix-ui/react-menubar": "^1.x",
  "@radix-ui/react-navigation-menu": "^1.x",
  "@radix-ui/react-popover": "^1.x",
  "@radix-ui/react-progress": "^1.x",
  "@radix-ui/react-radio-group": "^1.x",
  "@radix-ui/react-scroll-area": "^1.x",
  "@radix-ui/react-select": "^1.x",
  "@radix-ui/react-separator": "^1.x",
  "@radix-ui/react-slider": "^1.x",
  "@radix-ui/react-slot": "^1.x",
  "@radix-ui/react-switch": "^1.x",
  "@radix-ui/react-tabs": "^1.x",
  "@radix-ui/react-toast": "^1.x",
  "@radix-ui/react-toggle": "^1.x",
  "@radix-ui/react-toggle-group": "^1.x",
  "@radix-ui/react-tooltip": "^1.x"
}
```

### Estado e Data Flow

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `zustand` | 5.x | Gerenciamento de estado global |
| `@tanstack/react-query` | 5.x | Cache e fetching de dados (opcional, para queries) |

### Formulários

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `react-hook-form` | 7.x | Formulários performáticos |
| `zod` | 3.x | Validação de schemas |
| `@hookform/resolvers` | 3.x | Integração zod + react-hook-form |

### Discord RPC (Frontend)

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `@discord/embedded-app-sdk` | 1.x | Discord SDK (se usar Activity) |
| Ou via backend | - | Discord RPC é controlado pelo Rust (`discord-rich-presence`), frontend só exibe status |

> **Nota:** Discord RPC é mais confiável no backend Rust. O frontend apenas reflete o estado (conectado/desconectado) via evento Tauri.

### Ícones

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `lucide-react` | 0.400+ | Ícones principais (padrão shadcn/ui) |
| `@phosphor-icons/react` | 2.x | Ícones alternativos (jogos, launcher) |
| `react-icons` | 5.x | Coleção gigante de ícones (fallback) |

### Utilitários

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `date-fns` | 4.x | Manipulação de datas |
| `sonner` | 2.x | Toasts modernos |
| `recharts` | 2.x | Gráficos (uso futuro: estatísticas) |
| `framer-motion` | 12.x | Animações avançadas |
| `react-resizable-panels` | 2.x | Painéis redimensionáveis (console) |

### Desenvolvimento (devDependencies)

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `@types/react` | 19.x | Types para React |
| `@types/react-dom` | 19.x | Types para ReactDOM |
| `eslint` | 9.x | Linter |
| `@eslint/js` | 9.x | Config ESLint |
| `typescript-eslint` | 8.x | ESLint para TypeScript |
| `eslint-plugin-react-hooks` | 5.x | Regras para hooks |
| `prettier` | 3.x | Formatador |
| `prettier-plugin-tailwindcss` | 0.6.x | Ordenação automática de classes Tailwind |
| `@tailwindcss/typography` | 0.5.x | Tipografia (opcional) |

---

## 11.3 shadcn/ui — Componentes Originais

O shadcn/ui **não é uma dependência npm**. Ele é um **CLI** que gera componentes React diretamente no seu projeto. Você escolhe quais componentes instalar.

### Instalação

```bash
npx shadcn@latest init
```

### Componentes Planejados

| Componente | Uso no Launcher |
|-----------|----------------|
| `Button` | Ações principais (Criar, Lançar, Excluir) |
| `Input` | Formulários (nome da instância, nome de usuário) |
| `Card` | Cards de instância na lista |
| `Dialog` | Modal de criação/edição de instância |
| `Select` | Seleção de versão, loader, Java |
| `Tabs` | Abas de configuração da instância |
| `Progress` | Barra de progresso de download |
| `Badge` | Status (Vanilla, Fabric, Quilt) |
| `ScrollArea` | Console de log, listas extensas |
| `Separator` | Divisores visuais |
| `Switch` | Toggles de configuração |
| `Slider` | Ajuste de RAM/argumentos JVM |
| `Tooltip` | Dicas em ícones e ações |
| `Toast` | Notificações (download completo, erro) |
| `DropdownMenu` | Menu de contexto da instância |
| `ContextMenu` | Clique direito na instância |
| `Avatar` | Ícone da instância |
| `AlertDialog` | Confirmação de exclusão |
| `Skeleton` | Loading state da lista |
| `Accordion` | Lista de pastas com instâncias dentro |
| `Collapsible` | Pastas recolhíveis na sidebar |
| `Command` | Paleta de comandos (busca rápida de instâncias) |
| `Popover` | Seletor de versão avançado |
| `Table` | Tabela de versões disponíveis |
| `Sheet` | Painel lateral de detalhes da instância |
| `HoverCard` | Preview da instância ao passar o mouse |

### Instalação seletiva

```bash
npx shadcn@latest add button card dialog input select tabs progress badge scroll-area separator switch slider tooltip toast dropdown-menu context-menu avatar alert-dialog skeleton accordion collapsible command popover table sheet hover-card
```

---

## 11.4 Dependências por Feature

### Feature: Instâncias
```
Rust: serde, serde_json, uuid, sha1
Frontend: @radix-ui/react-dialog, @radix-ui/react-select, lucide-react
```

### Feature: Download
```
Rust: reqwest, reqwest-retry, tokio, sha1, zip, flate2, tempfile, tracing
Frontend: @radix-ui/react-progress, sonner
```

### Feature: Launch
```
Rust: tauri-plugin-shell, mc-launcher-core, serde_json, tracing, discord-rich-presence
Frontend: @radix-ui/react-scroll-area, @tanstack/react-query (event stream)
```

### Feature: Java
```
Rust: reqwest, semver, dirs, sysinfo, zip
Frontend: @radix-ui/react-select, @radix-ui/react-progress
```

### Feature: Settings
```
Rust: serde, serde_json, dirs, tauri-plugin-dialog
Frontend: @radix-ui/react-switch, @radix-ui/react-slider, @radix-ui/react-tabs
```

### Feature: Persistência (Todas)
```
Rust: rusqlite, serde_json, serde
Frontend: nenhum (backend gerencia)
```

### Feature: Discord RPC
```
Rust: discord-rich-presence
Frontend: lucide-react (ícone Discord), badge de status
```

### Feature: Playtime
```
Rust: chrono, serde, serde_json
Frontend: date-fns, recharts (gráficos), lucide-react (ícone relógio)
```

### Feature: Pastas (Folders)
```
Rust: serde, serde_json, uuid
Frontend: @radix-ui/react-accordion, @radix-ui/react-dropdown-menu, lucide-react
```

### Feature: CurseForge
```
Rust: reqwest, serde, serde_json, tracing
Frontend: @radix-ui/react-dialog, @radix-ui/react-tabs, @radix-ui/react-select, lucide-react, sonner
```

### Feature: Modrinth
```
Rust: reqwest, serde, serde_json, tracing
Frontend: @radix-ui/react-dialog, @radix-ui/react-tabs, @radix-ui/react-select, lucide-react, sonner
```

### Feature: Todas as Versões
```
Rust: mc-launcher-core, serde, serde_json, regex
Frontend: @radix-ui/react-select, @radix-ui/react-badge, lucide-react
```

---

## 11.5 Por que essas escolhas?

| Decisão | Motivo |
|---------|--------|
| `tauri-plugin-shell` em vez de `std::process` | Gerenciamento de processos seguro no contexto Tauri |
| `reqwest` em vez de `ureq` | Async-first, middleware, retry, streaming |
| `discord-rich-presence` no Rust | Mais estável que IPC via frontend |
| `zustand` em vez de Redux | Leve, simples, tipado, sem boilerplate |
| `react-hook-form` + `zod` | Validação forte e performática sem re-renders |
| `lucide-react` como ícone principal | Padrão shadcn/ui, consistente, tree-shakeable |
| `sonner` em vez de `react-hot-toast` | Leve, acessível, bonito por padrão |
| `tracing` em vez de `log` | Estruturado, async-aware, múltiplos subscribers |
