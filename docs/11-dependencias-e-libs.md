# 11 — Dependências e Bibliotecas

Versões exatas conforme `Cargo.toml` / `package.json` no momento desta revisão.

## 11.1 Rust (Cargo.toml)

### Core

| Biblioteca                       | Versão                  | Finalidade                                             |
| -------------------------------- | ----------------------- | ------------------------------------------------------ |
| `tauri`                          | 2.11.3                  | Framework desktop nativo (feature `protocol-asset`)    |
| `tauri-build`                    | 2.6.3                   | Build script do Tauri                                  |
| `tauri-plugin-dialog`            | 2.7.2                   | Diálogos nativos                                       |
| `tauri-plugin-fs`                | 2.5.1                   | Acesso ao sistema de arquivos                          |
| `tauri-plugin-shell`             | 2.3.5                   | Spawn de processos                                     |
| `tauri-plugin-clipboard-manager` | 2                       | Área de transferência                                  |
| `tauri-plugin-updater`           | 2.10.1                  | Auto-update in-app                                     |
| `tauri-plugin-process`           | 2.3.1                   | Controle do processo do próprio app (restart/exit)     |
| `tauri-plugin-single-instance`   | 2                       | Instância única + repasse de argv (atalhos/.astropack) |
| `tauri-plugin-log`               | 2                       | Logging integrado ao Tauri                             |
| `serde` / `serde_json`           | 1.0                     | Serialização/deserialização                            |
| `thiserror`                      | 2.0.19                  | Erros tipados                                          |
| `anyhow`                         | 1.0.104                 | Erros contextuais                                      |
| `tokio`                          | 1.53.1 (feature `full`) | Runtime assíncrono                                     |
| `log`                            | 0.4                     | Fachada de logging                                     |

### Minecraft

| Biblioteca         | Versão             | Finalidade                                                                     |
| ------------------ | ------------------ | ------------------------------------------------------------------------------ |
| `mc-launcher-core` | 0.1.2              | Building blocks de launcher (Forge/NeoForge installer, launch command builder) |
| `uuid`             | 1.20.0 (v4, serde) | UUIDs de contas offline                                                        |

Não existe crate `mc-versions` — parsing de tipos de versão é feito com os DTOs próprios (`VersionDTO`, `version_meta.rs`).

`mc_chat` foi **removido** na v0.5.2 (sem uso real — o lint `unused_crate_dependencies` pega dependências órfãs no CI).

### HTTP e Network

| Biblioteca | Versão                | Finalidade                |
| ---------- | --------------------- | ------------------------- |
| `reqwest`  | 0.13.3 (json, stream) | Cliente HTTP              |
| `zip`      | 2                     | Extração de `.jar`/`.zip` |

Não há `flate2` no Cargo.toml.

### Hash e Integridade

| Biblioteca | Versão | Finalidade         |
| ---------- | ------ | ------------------ |
| `sha1`     | 0.11.0 | Checksum de assets |
| `hex`      | 0.4.3  | Encoding hex       |

`sha2` e `md-5` foram **removidos** na v0.5.2 (sem uso).

### Sistema e Arquivos

| Biblioteca | Versão | Finalidade                                                                                           |
| ---------- | ------ | ---------------------------------------------------------------------------------------------------- |
| `dirs`     | 6.0.0  | Diretórios padrão (uso pontual — o app data dir principal vem do resolver do Tauri, não desta crate) |
| `walkdir`  | 2.5.0  | Iteração recursiva em diretórios                                                                     |
| `sysinfo`  | 0.39.6 | Info de memória/sistema (`get_total_system_memory_mb`)                                               |

`tempfile` virou **dev-dependency** (só testes) e `fs_extra`/`path-clean` foram **removidos** na v0.5.2.

### Processos e Áudio

| Biblioteca | Versão | Finalidade                                 |
| ---------- | ------ | ------------------------------------------ |
| `cpal`     | 0.18.1 | Listagem de dispositivos de áudio de saída |

### Discord RPC

| Biblioteca              | Versão | Finalidade            |
| ----------------------- | ------ | --------------------- |
| `discord-rich-presence` | 1.1.0  | Discord Rich Presence |

Não existe `discord-sdk` no projeto.

### Logging

| Biblioteca | Versão | Finalidade          |
| ---------- | ------ | ------------------- |
| `tracing`  | 0.1.44 | Logging estruturado |
| `chrono`   | 0.4.45 | Timestamps          |

`tracing-subscriber` e `tracing-appender` foram **removidos** na v0.5.2 (logs saem pelo `tauri-plugin-log`).

### APIs de Modpack

CurseForge e Modrinth são consumidas via `reqwest` + `serde` puro, sem crate dedicada:

- **CurseForge Core API** — requer API key (`CURSEFORGE_API_KEY`, injetada no CI)
- **Modrinth API v3** — pública, sem key

### Banco de Dados

| Biblioteca | Versão                     | Finalidade                 |
| ---------- | -------------------------- | -------------------------- |
| `rusqlite` | 0.40.1 (feature `bundled`) | SQLite embutido no binário |

Não há `rusqlite_migration` — migrações são uma tabela de function pointers escrita à mão (`persistence/migrations/mod.rs`).

### Config e Auth

Nenhuma — `toml` e `jsonwebtoken` foram **removidos** na v0.5.2 (sem uso real).

### Utilitários

| Biblioteca    | Versão | Finalidade                                                                                                                                    |
| ------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `once_cell`   | 1.21.4 | Lazy statics                                                                                                                                  |
| `parking_lot` | 0.12.5 | Mutex/RwLock                                                                                                                                  |
| `futures`     | 0.3.33 | Combinadores de futures — downloads concorrentes (`buffer_unordered`) em `asset_downloader.rs`, `launch_instance.rs` e `modpack_installer.rs` |
| `base64`      | 0.23.0 | Encoding base64 (ícones customizados)                                                                                                         |

`crossbeam`, `itertools`, `regex`, `semver` e `async-trait` foram **removidos** na v0.5.2 (sem uso).

### Desenvolvimento (dev-dependencies)

| Biblioteca | Versão | Finalidade                     |
| ---------- | ------ | ------------------------------ |
| `tempfile` | 3.27.0 | Arquivos temporários em testes |

`mockall` e `criterion` foram **removidos** na v0.5.2 (sem uso real — adicionar de volta só quando houver teste/benchmark que precise).

---

## 11.2 Frontend (package.json)

### Core

| Pacote                                 | Versão | Finalidade                    |
| -------------------------------------- | ------ | ----------------------------- |
| `react` / `react-dom`                  | 19.2.7 | UI Library                    |
| `react-router-dom`                     | 7.18.2 | Roteamento SPA (`HashRouter`) |
| `typescript`                           | ~6.0.2 | Type safety                   |
| `vite`                                 | 8.2.0  | Bundler e dev server          |
| `@vitejs/plugin-react`                 | 6.0.5  | Plugin Vite para React        |
| `@tauri-apps/api`                      | 2.11.1 | API IPC Tauri                 |
| `@tauri-apps/plugin-dialog`            | 2.7.2  | Diálogos nativos              |
| `@tauri-apps/plugin-fs`                | 2.5.1  | Acesso a arquivos             |
| `@tauri-apps/plugin-shell`             | 2.3.5  | Shell/processos               |
| `@tauri-apps/plugin-clipboard-manager` | 2.3.2  | Clipboard                     |
| `@tauri-apps/plugin-process`           | 2.3.1  | Controle do processo do app   |
| `@tauri-apps/plugin-updater`           | 2.10.1 | Auto-update                   |

### UI (shadcn/ui)

| Pacote                     | Versão  | Finalidade                                                                    |
| -------------------------- | ------- | ----------------------------------------------------------------------------- |
| `tailwindcss`              | 4.3.3   | Utility-first CSS                                                             |
| `@tailwindcss/vite`        | 4.3.3   | Plugin Tailwind para Vite                                                     |
| `tw-animate-css`           | 1.4.0   | Animações Tailwind (o `tailwindcss-animate` foi **removido** na v0.5.2)       |
| `class-variance-authority` | 0.7.1   | Variantes de classe (cva)                                                     |
| `clsx`                     | 2.1.1   | Junção condicional de classes                                                 |
| `tailwind-merge`           | 3.6.0   | Merge de classes Tailwind                                                     |
| `lucide-react`             | ^1.28.0 | Ícones (esquema de versionamento mudou — não é mais `0.4xx`)                  |
| `radix-ui`                 | ^1.6.7  | **Meta-pacote único** — substituiu os pacotes individuais `@radix-ui/react-*` |
| `shadcn`                   | ^4.16.1 | CLI do shadcn/ui, presente como dependência (não só via `npx`)                |

O projeto **não** usa mais pacotes `@radix-ui/react-*` individuais — tudo vem do meta-pacote `radix-ui`.

### Estado

| Pacote    | Versão | Finalidade    |
| --------- | ------ | ------------- |
| `zustand` | 5.0.14 | Estado global |

### Discord RPC

Discord é controlado inteiramente pelo backend Rust (`discord-rich-presence`). Frontend não tem SDK do Discord — apenas `src/hooks/useDiscordPresence.ts` chama o comando `discord_set_presence` e reflete estado via UI.

### Ícones

| Pacote         | Versão  | Finalidade        |
| -------------- | ------- | ----------------- |
| `lucide-react` | ^1.28.0 | Ícones principais |

### Editor e Conteúdo Rico

| Pacote                                                                          | Versão                         | Finalidade                            |
| ------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------- |
| `@uiw/react-codemirror` + `@codemirror/lang-json`                               | 4.25.11 / 6.0.2                | Editor de código (arquivos de config) |
| `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`, `@tiptap/extension-image` | 3.29.0                         | Editor rich-text (notas de instância) |
| `tiptap-markdown`                                                               | 0.9.0                          | Export/import markdown do Tiptap      |
| `react-markdown`, `remark-gfm`, `rehype-raw`, `rehype-sanitize`                 | 10.1.0 / 4.0.1 / 7.0.0 / 6.0.0 | Renderização de markdown              |

Nenhum desses estava documentado antes — cobrem o editor de config e as notas de instância.

### Drag & Drop

| Pacote                                                                           | Versão                         | Finalidade                              |
| -------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------- |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`, `@dnd-kit/utilities` | 6.3.1 / 10.0.0 / 9.0.0 / 3.2.2 | Reordenação de instâncias/pastas/contas |

### Skins e Imagens

| Pacote            | Versão | Finalidade                     |
| ----------------- | ------ | ------------------------------ |
| `skinview3d`      | 3.4.2  | Visualizador 3D de skins       |
| `react-easy-crop` | 6.2.3  | Recorte de ícones customizados |

### Utilitários

| Pacote                       | Versão  | Finalidade               |
| ---------------------------- | ------- | ------------------------ |
| `sonner`                     | 2.0.7   | Toasts                   |
| `framer-motion`              | 12.43.0 | Animações                |
| `react-resizable-panels`     | 4.12.2  | Painéis redimensionáveis |
| `cmdk`                       | 1.1.1   | Command palette          |
| `next-themes`                | 0.4.6   | Tema claro/escuro        |
| `@fontsource-variable/geist` | 5.3.0   | Fonte Geist              |

### Desenvolvimento (devDependencies)

| Pacote                              | Versão           | Finalidade                                                 |
| ----------------------------------- | ---------------- | ---------------------------------------------------------- |
| `@types/react` / `@types/react-dom` | 19.2.18 / 19.2.4 | Types                                                      |
| `@types/node`                       | 26.1.2           | Types Node                                                 |
| `eslint`                            | 10.6.0           | Linter                                                     |
| `@eslint/js`                        | 10.0.1           | Config ESLint                                              |
| `typescript-eslint`                 | 8.65.0           | ESLint para TS                                             |
| `eslint-plugin-react-hooks`         | 7.1.1            | Regras de hooks                                            |
| `eslint-plugin-react-refresh`       | 0.5.3            | Regras de fast refresh                                     |
| `eslint-config-prettier`            | 10.1.8           | Desliga regras conflitantes com Prettier                   |
| `prettier`                          | 3.9.6            | Formatador                                                 |
| `prettier-plugin-tailwindcss`       | 0.8.1            | Ordenação de classes Tailwind                              |
| `@tailwindcss/typography`           | 0.5.20           | Tipografia                                                 |
| `@tauri-apps/cli`                   | 2.11.4           | CLI do Tauri                                               |
| `knip`                              | ^6.32.0          | Dead-code/unused deps — `npm run knip`, **bloqueia o CI**  |
| `cross-env`                         | 10.1.0           | Env vars cross-platform (usado no script `dev:tauri:fast`) |
| `globals`                           | 17.7.0           | Configuração de globals para ESLint                        |

---

## 11.3 shadcn/ui — Componentes Instalados

shadcn/ui não é dependência npm tradicional — é um CLI que gera componentes em `src/components/ui/`. Lista real (30+):

```
accordion, alert, alert-dialog, avatar, badge, button, card, checkbox, collapsible,
command, context-menu, dialog, dropdown-menu, hover-card, input, input-group, label,
pagination, popover, progress, resizable, scroll-area, select, separator, sheet,
skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip
```

Não há `menubar`, `navigation-menu`, `radio-group`, `aspect-ratio` nem `toast` (o toast usado é `sonner`, não o componente shadcn `toast`).

---

## 11.4 Notas Importantes

- **Radix consolidado**: pare de procurar `@radix-ui/react-*` individuais no `package.json` — tudo vem via `radix-ui` (pacote único).
- **`lucide-react` mudou de esquema de versão**: está em `^1.28.0`, não `0.4xx` como versões antigas do launcher usavam.
- **Sem retry/backoff no download**: o `reqwest` é usado puro; não há camada de retry.
- **Lint `unused_crate_dependencies`** (`#![warn(...)]` em `lib.rs`, allow em `main.rs`): qualquer dependência do `Cargo.toml` sem um único `use` no crate quebra o clippy do CI — foi o que motivou a limpeza de deps da v0.5.2. Dependência nova que não será importada é proibida.
