# 🤝 Contribuindo com o AstroLauncher

Este guia descreve o fluxo para contribuir com o projeto: configuração do ambiente, padrões de código e Pull Requests.

> 📖 Leia também a [documentação completa](docs/README.md) do projeto para entender a arquitetura e os padrões.

## 📋 Índice

- [Ambiente de desenvolvimento](#-ambiente-de-desenvolvimento)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Fluxo de trabalho](#-fluxo-de-trabalho)
- [Padrões de código](#-padrões-de-código)
- [Verificações automáticas (CI)](#-verificações-automáticas-ci)
- [Convenção de commits](#-convenção-de-commits)
- [Pull Requests](#-pull-requests)
- [Notas de release](#-notas-de-release)
- [Reportando bugs](#-reportando-bugs)

## 🛠️ Ambiente de desenvolvimento

### Pré-requisitos

| Ferramenta   | Versão | Observação                                         |
| ------------ | ------ | -------------------------------------------------- |
| **Node.js**  | 20+    | Necessário para o frontend                         |
| **Rust**     | stable | Toolchain completa via [rustup](https://rustup.rs) |
| **WebView2** | atual  | Windows Runtime (já vem na maioria dos Windows)    |

### Rodando localmente

```bash
# 1. Instala as dependências do frontend
npm install

# 2. Modo desenvolvimento (com splash screen)
npm run dev:tauri

# 3. Modo desenvolvimento rápido, sem splash, ideal para iterar
npm run dev:tauri:fast
```

### Scripts úteis

| Script                   | Descrição                     |
| ------------------------ | ----------------------------- |
| `npm run dev`            | Só o frontend (Vite)          |
| `npm run dev:tauri`      | App completo em modo dev      |
| `npm run dev:tauri:fast` | App em modo dev sem splash    |
| `npm run build`          | Typecheck + build de produção |
| `npm run lint`           | ESLint em todo o código       |
| `npm run tauri build`    | Build completo do instalador  |

> [!TIP]
> O backend Rust é compilado automaticamente pelo Tauri quando você roda `dev:tauri`. Não precisa rodar `cargo` manualmente para o dia a dia.

## 📂 Estrutura do projeto

```
AstroLauncher/
├── src/            # 🎨 Frontend (React + TypeScript)
│   ├── components/ #   UI (shadcn/ui) + layout + splash
│   ├── stores/     #   Zustand stores
│   ├── lib/        #   API client, utilitários
│   └── types/      #   Tipos espelhando os DTOs
├── src-tauri/      # 🦀 Backend (Rust + Tauri)
│   └── app/
│       ├── application/     # use cases, DTOs, mappers
│       ├── domain/          # entidades, traits, erros
│       ├── infrastructure/  # minecraft, java, downloader, sqlite...
│       └── presentation/    # comandos Tauri, estado, IPC
├── docs/           # 📚 Documentação de arquitetura
└── .github/
    ├── workflows/  # CI/CD
    └── releases/   # Notas de release versionadas
```

## 🧭 Fluxo de trabalho

### 1. Crie um fork

Clique em **Fork** no GitHub e clone o seu fork:

```bash
git clone https://github.com/SEU_USUARIO/AstroLauncher.git
cd AstroLauncher
```

### 2. Adicione o repositório original como upstream

```bash
git remote add upstream https://github.com/kauafpssx/AstroLauncher.git
git fetch upstream
```

### 3. Crie uma branch

Trabalhe sempre em uma branch separada, com nome descritivo:

```bash
git checkout -b feat/novo-recurso
# ou
git checkout -b fix/correcao-bug
```

Padrão de nomenclatura:

| Prefixo     | Uso                                       |
| ----------- | ----------------------------------------- |
| `feat/`     | Novas funcionalidades                     |
| `fix/`      | Correções de bugs                         |
| `refactor/` | Refatorações sem mudança de comportamento |
| `docs/`     | Documentação                              |
| `chore/`    | Tarefas de manutenção                     |

### 4. Faça commits

Siga a [convenção de commits](#-convenção-de-commits) abaixo.

### 5. Envie e abra um PR

```bash
git push origin feat/novo-recurso
```

Abra um Pull Request no GitHub contra a branch `main`, preenchendo o [template de PR](.github/PULL_REQUEST_TEMPLATE.md).

## 📏 Padrões de código

### Backend (Rust)

- Erros tipados com `thiserror`, nunca `String` crua
- Camadas respeitadas: Presentation → Application → Domain → Infrastructure. A UI nunca fala direto com a Infrastructure
- Funções e casos de uso pequenos, com responsabilidade única

### Frontend (TypeScript/React)

- Componentes feature-first, organizados por domínio
- UI construída com shadcn/ui (Radix + Tailwind)
- Estados globais com Zustand, dados remotos via hooks → actions do store → API services (sem TanStack Query)

### Geral

- Código em inglês. Comentários explicam o porquê, não o o quê
- Arquivos com no máximo 200 linhas, ideal 80 a 150
- Execute `npm run lint` antes de enviar o PR

> [!NOTE]
> A documentação (`docs/` e arquivos `.md`) é escrita em português. O código-fonte é em inglês.

## 🤖 Verificações automáticas (CI)

Todo push e Pull Request dispara o workflow **Testes** (`.github/workflows/quality-gate.yml`), com jobs paralelos por área:

| Área        | O que roda                                                    |
| ----------- | ------------------------------------------------------------- |
| ⚛️ Frontend | ESLint, Prettier, `tsc`, build Vite, knip (dead code)         |
| 🦀 Rust     | `cargo fmt`, `check`, `clippy -D warnings`, `test`, `doc`     |
| 🚀 Build    | build Tauri completo no Windows + verificação do binário NSIS |

Revisão de PR é feita pelo **CodeRabbit** (`.coderabbit.yaml`), que comenta direto no PR. O build de release fica separado em `.github/workflows/build.yml`.

> [!TIP]
> A maioria dos checks é informativa (não bloqueia merge), mas o objetivo é manter tudo verde. Rode `npm run lint`, `npm run format` e `cargo clippy` localmente antes de abrir o PR para evitar surpresas.

## 💬 Convenção de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
<tipo>(<escopo>): <descrição>
```

| Tipo       | Descrição                                   |
| ---------- | ------------------------------------------- |
| `feat`     | Nova funcionalidade                         |
| `fix`      | Correção de bug                             |
| `refactor` | Mudança de código sem alterar comportamento |
| `perf`     | Melhoria de performance                     |
| `style`    | Formatação, espaçamento, sem mudança lógica |
| `docs`     | Documentação                                |
| `test`     | Testes                                      |
| `chore`    | Tarefas de manutenção (deps, build, etc.)   |
| `ci`       | Configuração de CI/CD                       |

Exemplos:

```bash
git commit -m "feat(instances): adiciona exportação em .astropack"
git commit -m "fix(java): corrige detecção de runtime na versão 1.21"
git commit -m "docs(readme): atualiza instruções de build"
```

## 🔀 Pull Requests

### Checklist antes de abrir

- [ ] Branch criada a partir da `main` atualizada
- [ ] Código segue os [padrões do projeto](#-padrões-de-código)
- [ ] `npm run lint` passou sem erros
- [ ] `npm run build` (typecheck) passou
- [ ] `npm run format` aplicado (Prettier) e `cargo clippy` sem warnings novos
- [ ] Testado manualmente (ou com testes automatizados, quando houver)
- [ ] [Notas de release](#-notas-de-release) atualizadas se necessário

> [!TIP]
> Ao abrir o PR, o **Quality Gate** roda sozinho. Espere os checks fecharem antes de mergear — veja [Verificações automáticas (CI)](#-verificações-automáticas-ci).

### Durante a revisão

- Responda aos comentários e faça os ajustes solicitados
- Mantenha o PR focado: um PR, uma mudança. PRs gigantes demoram mais para revisar
- Se a `main` avançar, faça rebase em vez de merge para manter o histórico limpo:

```bash
git fetch upstream
git rebase upstream/main
```

## 🏷️ Notas de release

As notas de release ficam em [`.github/releases/`](.github/releases/). O CI usa o arquivo `_template.md` como fallback e a release com o tag da versão (ex: `v0.2.0.md`) quando existe.

- Ao adicionar uma funcionalidade ou correção relevante, crie ou atualize o arquivo `.github/releases/vX.Y.Z.md` seguindo o [`_template.md`](.github/releases/_template.md)
- O CI gera automaticamente a release e o manifest de atualização (`latest.json`)

## 🐛 Reportando bugs

- Verifique se o bug já não foi reportado nas [issues](https://github.com/kauafpssx/AstroLauncher/issues)
- Use o [template de bug](.github/ISSUE_TEMPLATE/bug_report.yml). Quanto mais detalhes (versão, OS, loader, logs), mais rápido é o diagnóstico
- Bugs de segurança: não abra issue pública. Siga o processo descrito em [`SECURITY.md`](SECURITY.md)

## 🧡 Obrigado

Contribuições de qualquer tamanho são bem-vindas, desde corrigir um typo na documentação até implementar um módulo inteiro. Feito com 💜 no Brasil. 🚀
