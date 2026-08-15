# 01 — Visão Geral do Projeto

## 1.1 Propósito

Desenvolver um launcher de Minecraft moderno, utilizando Rust no backend e React com shadcn/ui no frontend, empacotado com Tauri. O projeto é minimamente inspirado no PrismLauncher, mas com foco em arquitetura limpa, estética moderna e facilidade de manutenção.

## 1.2 Público-Alvo

Jogadores de Minecraft que desejam um launcher leve, rápido e visualmente moderno, com suporte a contas offline e múltiplas versões/loaders.

## 1.3 Tecnologias

| Camada          | Tecnologia                         |
| --------------- | ---------------------------------- |
| Backend         | Rust                               |
| Frontend        | React + TypeScript                 |
| UI Library      | shadcn/ui (Radix + Tailwind)       |
| Desktop Wrapper | Tauri                              |
| Store           | Zustand                            |
| Minecraft API   | mc-launcher-core                   |
| Modpacks API    | CurseForge Core API + Modrinth API |
| Ícones          | lucide-react                       |

## 1.4 Funcionalidades Principais

- **Gerenciamento de instâncias:** criar, editar, excluir, organizar em pastas (drag & drop)
- **Suporte a TODAS as versões do Minecraft:** releases, snapshots, alphas, betas, infdev, classic, indev
- **Loaders:** Fabric, Quilt, Forge, NeoForge, LiteLoader
- **Contas offline:** modo crackeado, múltiplas contas com reordenação
- **Download automático:** client jars, bibliotecas e assets
- **Gerenciamento de runtimes Java:** detecção de Java do sistema ou download de JRE portátil (Adoptium Temurin)
- **Lançamento do jogo:** construção do comando Java com argumentos corretos
- **Playtime tracking:** tempo de jogo por instância, sessões e resumo
- **Sistema de pastas:** organização de instâncias em grupos/categorias
- **Mod Browser:** busca e instalação de mods via Modrinth e CurseForge
- **Modpacks:** instalação direta de `.mrpack` e manifests da CurseForge
- **Editor de instância:** notas, mundos, servers.dat, screenshots, arquivos de config (`options.txt`, keybinds, arquivos de `config/`)
- **Ícones customizados:** presets ou upload com recorte
- **Visualizador de skins 3D:** busca de skins (PlayerMC + MCStat) com preview via skinview3d
- **Discord Rich Presence:** status do jogo exibido no Discord
- **AstroPack:** exportação/importação de instâncias completas
- **Atalhos de desktop:** criar atalho da instância na área de trabalho, com ícone customizado
- **Duplicar instância:** cópia completa com mods, mundos e configurações
- **Sugestão de memória:** RAM mín/máx estimada conforme conteúdo instalado, aplicada em modpacks e editável na UI (v0.5.2)
- **Idioma automático:** instâncias novas abrem no locale do Windows (`lang:` no `options.txt`) (v0.5.2)
- **Persistência de janela:** posição/tamanho/maximizado restaurados no próximo launch (v0.5.2)
- **Rede ZeroTier (v0.6.0):** instalação do serviço, entrar/sair de redes, aprovar/desautorizar membros via ZeroTier Central
- **Janela do jogo configurável + Java por instância + avatares de conta (v0.6.0):** fullscreen, dimensões e monitor por instância; Java específico por instância; avatar (skin head) por conta
- **Auto-update:** atualizações automáticas via `tauri-plugin-updater`
- **Console de log:** saída do jogo em tempo real
- **Interface moderna:** shadcn/ui com tema escuro

## 1.5 Princípios Arquiteturais

- **Clean Architecture** — Separação em camadas (Domain, Application, Infrastructure, Presentation)
- **Hexagonal Architecture (Ports & Adapters)** — Domínio isolado de frameworks e I/O
- **DDD Lite** — Módulos organizados por domínio, não por tecnologia
- **Vertical Slice** — Cada funcionalidade autocontida em seu módulo
- **CQRS-lite por convenção** — leitura e escrita em structs separadas (`List*UseCase` vs `Create/Update/Delete*UseCase`), sem tipos formais de Command/Query nem event bus (ver [04](04-modulos-e-dominios.md))
- **Repository Pattern** — Abstração de persistência
- **SOLID** — Especialmente Single Responsibility e Dependency Inversion
