# AstroLauncher

Este documento lista as licenças e avisos de copyright do AstroLauncher e de todo o software de terceiros incorporado ou utilizado pelo projeto.

---

## AstroLauncher

     AstroLauncher - Minecraft Launcher
     Copyright (C) 2026 kauafpssx

     This program is free software: you can redistribute it and/or modify
     it under the terms of the GNU General Public License as published by
     the Free Software Foundation, version 3.

     This program is distributed in the hope that it will be useful,
     but WITHOUT ANY WARRANTY; without even the implied warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     GNU General Public License for more details.

     You should have received a copy of the GNU General Public License
     along with this program.  If not, see <https://www.gnu.org/licenses/>.

O texto completo da licença está disponível no arquivo [`LICENSE`](LICENSE).

---

## Prism Launcher

O AstroLauncher é **minimamente inspirado** no Prism Launcher. Nenhum código-fonte do Prism Launcher é incorporado diretamente neste projeto, mas o reconhecimento é mantido por cortesia:

     Prism Launcher - Minecraft Launcher
     Copyright (C) 2022-2026 Prism Launcher Contributors

     This program is free software: you can redistribute it and/or modify
     it under the terms of the GNU General Public License as published by
     the Free Software Foundation, version 3.

     This program is distributed in the hope that it will be useful,
     but WITHOUT ANY WARRANTY; without even the implied warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     GNU General Public License for more details.

     You should have received a copy of the GNU General Public License
     along with this program.  If not, see <https://www.gnu.org/licenses/>.

    O Prism Launcher incorpora trabalho coberto pelo seguinte aviso de
    copyright e permissão:

         Copyright 2013-2021 MultiMC Contributors

         Licensed under the Apache License, Version 2.0 (the "License");
         you may not use this file except in compliance with the License.
         You may obtain a copy of the License at

             http://www.apache.org/licenses/LICENSE-2.0

         Unless required by applicable law or agreed to in writing, software
         distributed under the License is distributed on an "AS IS" BASIS,
         WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
         See the License for the specific language governing permissions and
         limitations under the License.

---

## Dependências Rust (crates)

As seguintes bibliotecas Rust são utilizadas pelo AstroLauncher. As versões listadas são as declaradas em [`Cargo.toml`](src-tauri/Cargo.toml) e as licenças são as declaradas por cada crate.

### Core e Framework

| Crate | Versão | Licença |
|-------|--------|---------|
| `tauri` | 2.11.3 | Apache-2.0 OR MIT |
| `tauri-build` | 2.6.3 | Apache-2.0 OR MIT |
| `tauri-plugin-log` | 2 | Apache-2.0 OR MIT |
| `tauri-plugin-dialog` | 2.7.2 | Apache-2.0 OR MIT |
| `tauri-plugin-fs` | 2.5.1 | Apache-2.0 OR MIT |
| `tauri-plugin-shell` | 2.3.5 | Apache-2.0 OR MIT |
| `tauri-plugin-clipboard-manager` | 2 | Apache-2.0 OR MIT |
| `tauri-plugin-updater` | 2.10.1 | Apache-2.0 OR MIT |
| `tauri-plugin-process` | 2.3.1 | Apache-2.0 OR MIT |
| `serde` | 1 | MIT OR Apache-2.0 |
| `serde_json` | 1 | MIT OR Apache-2.0 |
| `thiserror` | 2.0.19 | MIT OR Apache-2.0 |
| `anyhow` | 1.0.104 | MIT OR Apache-2.0 |
| `tokio` | 1.53.1 | MIT |
| `log` | 0.4 | MIT OR Apache-2.0 |
| `once_cell` | 1.21.4 | MIT OR Apache-2.0 |

### Minecraft

| Crate | Versão | Licença |
|-------|--------|---------|
| `mc-launcher-core` | 0.1.2 | MIT |
| `mc_chat` | 0.3.0 | MIT OR Apache-2.0 |
| `uuid` | 1.20.0 | Apache-2.0 OR MIT |

### HTTP e Rede

| Crate | Versão | Licença |
|-------|--------|---------|
| `reqwest` | 0.13.3 | MIT OR Apache-2.0 |
| `reqwest-middleware` | 0.5.2 | MIT OR Apache-2.0 |
| `reqwest-retry` | 0.9.1 | MIT OR Apache-2.0 |
| `zip` | 2 | MIT |

### Hash, Criptografia e Dados

| Crate | Versão | Licença |
|-------|--------|---------|
| `sha1` | 0.10.7 | MIT OR Apache-2.0 |
| `sha2` | 0.10.9 | MIT OR Apache-2.0 |
| `md-5` | 0.10.6 | MIT OR Apache-2.0 |
| `hex` | 0.4.3 | MIT OR Apache-2.0 |
| `base64` | 0.22.1 | MIT OR Apache-2.0 |
| `jsonwebtoken` | 9.3.1 | MIT |
| `rusqlite` | 0.40.1 | MIT |

### Sistema, Arquivos e Áudio

| Crate | Versão | Licença |
|-------|--------|---------|
| `dirs` | 6.0.0 | MIT OR Apache-2.0 |
| `sysinfo` | 0.36.1 | MIT |
| `cpal` | 0.18.1 | Apache-2.0 |
| `tempfile` | 3.27.0 | MIT OR Apache-2.0 |
| `walkdir` | 2.5.0 | Unlicense/MIT |
| `fs_extra` | 1.3.0 | MIT |
| `path-clean` | 1.0.1 | MIT OR Apache-2.0 |

### Concorrência e Assíncrono

| Crate | Versão | Licença |
|-------|--------|---------|
| `parking_lot` | 0.12.5 | MIT OR Apache-2.0 |
| `crossbeam` | 0.8.4 | MIT OR Apache-2.0 |
| `futures` | 0.3.33 | MIT OR Apache-2.0 |
| `async-trait` | 0.1.91 | MIT OR Apache-2.0 |

### Logging e Tempo

| Crate | Versão | Licença |
|-------|--------|---------|
| `tracing` | 0.1.44 | MIT |
| `tracing-subscriber` | 0.3.23 | MIT |
| `tracing-appender` | 0.2.5 | MIT |
| `chrono` | 0.4.45 | MIT OR Apache-2.0 |

### Utilitários e Integrações

| Crate | Versão | Licença |
|-------|--------|---------|
| `itertools` | 0.15.0 | MIT/Apache-2.0 |
| `regex` | 1.13.1 | MIT OR Apache-2.0 |
| `semver` | 1.0.28 | MIT OR Apache-2.0 |
| `toml` | 1.0.7 | MIT OR Apache-2.0 |
| `discord-rich-presence` | 1.1.0 | MIT |

### Desenvolvimento (dev-dependencies)

| Crate | Versão | Licença |
|-------|--------|---------|
| `criterion` | 0.5.1 | Apache-2.0 OR MIT |
| `mockall` | 0.15.0 | MIT OR Apache-2.0 |

---

## Dependências JavaScript (npm)

As seguintes bibliotecas JavaScript são utilizadas pelo AstroLauncher. As licenças listadas são as declaradas por cada pacote instalado.

### Framework e Build

| Pacote | Versão | Licença |
|--------|--------|---------|
| `react` | 19.2.8 | MIT |
| `react-dom` | 19.2.8 | MIT |
| `react-router-dom` | 7.18.1 | MIT |
| `typescript` | 6.0.3 | Apache-2.0 |
| `vite` | 8.1.5 | MIT |
| `@vitejs/plugin-react` | 6.0.4 | MIT |

### UI e Design System

| Pacote | Versão | Licença |
|--------|--------|---------|
| `tailwindcss` | 4.3.3 | MIT |
| `@tailwindcss/vite` | 4.3.3 | MIT |
| `radix-ui` | 1.6.7 | MIT |
| `shadcn` | 4.15.0 | MIT |
| `framer-motion` | 12.42.2 | MIT |
| `lucide-react` | 1.27.0 | ISC |
| `@phosphor-icons/react` | 2.1.10 | MIT |
| `react-icons` | 5.7.0 | MIT |
| `sonner` | 2.0.7 | MIT |
| `next-themes` | 0.4.6 | MIT |
| `cmdk` | 1.1.1 | MIT |
| `class-variance-authority` | 0.7.1 | Apache-2.0 |
| `clsx` | 2.1.1 | MIT |
| `tailwind-merge` | 3.6.0 | MIT |
| `tailwindcss-animate` | 1.0.7 | MIT |
| `tw-animate-css` | 1.4.0 | MIT |

### Tauri

| Pacote | Versão | Licença |
|--------|--------|---------|
| `@tauri-apps/api` | 2.11.1 | Apache-2.0 OR MIT |
| `@tauri-apps/cli` | 2.11.4 | Apache-2.0 OR MIT |
| `@tauri-apps/plugin-dialog` | 2.7.2 | MIT OR Apache-2.0 |
| `@tauri-apps/plugin-fs` | 2.5.1 | MIT OR Apache-2.0 |
| `@tauri-apps/plugin-shell` | 2.3.5 | MIT OR Apache-2.0 |
| `@tauri-apps/plugin-clipboard-manager` | 2.3.2 | MIT OR Apache-2.0 |
| `@tauri-apps/plugin-process` | 2.3.1 | MIT OR Apache-2.0 |
| `@tauri-apps/plugin-updater` | 2.10.1 | MIT OR Apache-2.0 |

### Estado e Dados

| Pacote | Versão | Licença |
|--------|--------|---------|
| `zustand` | 5.0.14 | MIT |
| `@tanstack/react-query` | 5.101.4 | MIT |
| `date-fns` | 4.4.0 | MIT |

### Formulários e Validação

| Pacote | Versão | Licença |
|--------|--------|---------|
| `react-hook-form` | 7.83.0 | MIT |
| `zod` | 4.4.3 | MIT |
| `@hookform/resolvers` | 5.5.7 | MIT |

### Editor, Markdown e Gráficos

| Pacote | Versão | Licença |
|--------|--------|---------|
| `@tiptap/react` | 3.29.0 | MIT |
| `@tiptap/starter-kit` | 3.29.0 | MIT |
| `@tiptap/pm` | 3.29.0 | MIT |
| `@tiptap/extension-image` | 3.29.0 | MIT |
| `tiptap-markdown` | 0.9.0 | MIT |
| `@uiw/react-codemirror` | 4.25.11 | MIT |
| `@codemirror/lang-json` | 6.0.2 | MIT |
| `react-markdown` | 10.1.0 | MIT |
| `rehype-raw` | 7.0.0 | MIT |
| `rehype-sanitize` | 6.0.0 | MIT |
| `remark-gfm` | 4.0.1 | MIT |
| `recharts` | 3.10.1 | MIT |

### 3D, Imagens e Interação

| Pacote | Versão | Licença |
|--------|--------|---------|
| `skinview3d` | 3.4.2 | MIT |
| `react-easy-crop` | 6.2.3 | MIT |
| `@dnd-kit/core` | 6.3.1 | MIT |
| `@dnd-kit/modifiers` | 9.0.0 | MIT |
| `@dnd-kit/sortable` | 10.0.0 | MIT |
| `@dnd-kit/utilities` | 3.2.2 | MIT |
| `react-resizable-panels` | 4.12.2 | MIT |

### Fontes e Desenvolvimento

| Pacote | Versão | Licença |
|--------|--------|---------|
| `@fontsource-variable/geist` | 5.3.0 | OFL-1.1 |
| `eslint` | 10.8.0 | MIT |
| `@eslint/js` | 10.0.1 | MIT |
| `typescript-eslint` | 8.65.0 | MIT |
| `eslint-plugin-react-hooks` | 7.1.1 | MIT |
| `eslint-plugin-react-refresh` | 0.5.3 | MIT |
| `globals` | 17.8.0 | MIT |
| `prettier` | 3.9.6 | MIT |
| `prettier-plugin-tailwindcss` | 0.8.1 | MIT |
| `postcss` | 8.5.23 | MIT |
| `autoprefixer` | 10.5.4 | MIT |
| `cross-env` | 10.1.0 | MIT |
| `@tailwindcss/typography` | 0.5.20 | MIT |
| `@types/react` | 19.2.17 | MIT |
| `@types/react-dom` | 19.2.3 | MIT |
| `@types/node` | 24.13.3 | MIT |

---

## APIs e serviços externos

O AstroLauncher utiliza e agradece às seguintes APIs e serviços, que tornam o projeto possível:

| Serviço | URL | Uso no projeto |
|---------|-----|----------------|
| 🌍 **Mojang launchermeta** | https://launchermeta.mojang.com | Manifesto com todas as versões do Minecraft (releases, snapshots, alphas, betas, clássicas) |
| 📦 **Mojang assets** | https://resources.download.minecraft.net | Download dos assets oficiais (sons, idiomas, texturas) |
| 🧪 **Modrinth API** | https://api.modrinth.com | Busca e instalação de mods e modpacks |
| 🔥 **CurseForge Core API** | https://api.curseforge.com | Busca e instalação de modpacks |
| ☕ **Adoptium (Eclipse Temurin)** | https://api.adoptium.net | Download automático de runtimes Java |
| 🧵 **Fabric Meta** | https://meta.fabricmc.net | Resolução de versões do loader Fabric |
| 🪡 **Quilt Meta** | https://meta.quiltmc.org | Resolução de versões do loader Quilt |
| 🪄 **LiteLoader** | https://dl.liteloader.com | Lista de versões e repositório do LiteLoader |
| 📚 **Maven Central** | https://repo1.maven.org | Bibliotecas Java (launchwrapper e dependências) |
| 👕 **PlayerMC** | https://api.playermc.site | Texturas de skins dos jogadores |
| 🖼️ **vzge.me** | https://vzge.me | Renderização de avatares 3D das skins |
| 💬 **Discord** | https://discord.com | Discord Rich Presence (status do jogo no perfil) |
| 🚀 **GitHub Releases** | https://github.com/kauafpssx/AstroLauncher/releases | Manifesto e binários do auto-update |

> 🙏 **Agradecimentos especiais** à Mojang, ao ecossistema open source do Minecraft (Fabric, Quilt, LiteLoader), à Modrinth, à CurseForge e à comunidade que mantém esses serviços gratuitos. O AstroLauncher só existe por causa de vocês!

---

## Nota final

Este projeto é distribuído como software livre, sob os termos da **GNU General Public License v3.0** ([`LICENSE`](LICENSE)). Os avisos acima são mantidos para cumprir os termos de licença de cada componente de terceiros.
