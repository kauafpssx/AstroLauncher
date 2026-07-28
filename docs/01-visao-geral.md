# 01 — Visão Geral do Projeto

## 1.1 Propósito

Desenvolver um launcher de Minecraft moderno, utilizando Rust no backend e React com shadcn/ui no frontend, empacotado com Tauri. O projeto é inspirado no PrismLauncher-Cracked, mas com foco em arquitetura limpa, estética moderna e facilidade de manutenção.

## 1.2 Público-Alvo

Jogadores de Minecraft que desejam um launcher leve, rápido e visualmente moderno, com suporte a contas offline e múltiplas versões/loaders.

## 1.3 Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Backend | Rust |
| Frontend | React + TypeScript |
| UI Library | shadcn/ui (Radix + Tailwind) |
| Desktop Wrapper | Tauri |
| Store | Zustand |
| Minecraft API | mc-launcher-core |
| Modpacks API | CurseForge Core API + Modrinth API |
| Ícones | lucide-react, phosphor-icons |

## 1.4 Funcionalidades Principais

- **Gerenciamento de instâncias:** criar, editar, excluir, organizar em pastas
- **Suporte a TODAS as versões do Minecraft:** releases, snapshots, alphas, betas, versões antigas (infdev, classic, indev)
- **Loaders:** Fabric, Quilt (futuramente Forge/NeoForge)
- **Contas offline:** modo crackeado com nome de usuário customizado
- **Download automático:** client jars, bibliotecas e assets
- **Gerenciamento de runtimes Java:** download e detecção de JREs
- **Lançamento do jogo:** construção do comando Java com argumentos corretos
- **Playtime tracking:** tempo de jogo por instância e total acumulado
- **Sistema de pastas:** organização de instâncias em grupos/categorias
- **Integração CurseForge:** buscar e instalar modpacks diretamente
- **Integração Modrinth:** buscar e instalar mods e modpacks
- **Discord Rich Presence:** exibir status do jogo no Discord
- **Console de log:** saída do jogo em tempo real
- **Interface moderna:** shadcn/ui com tema claro/escuro

## 1.5 Princípios Arquiteturais

- **Clean Architecture** — Separação em camadas (Domain, Application, Infrastructure, Presentation)
- **Hexagonal Architecture (Ports & Adapters)** — Domínio isolado de frameworks e I/O
- **DDD Lite** — Módulos organizados por domínio, não por tecnologia
- **Vertical Slice** — Cada funcionalidade autocontida em seu módulo
- **Event Driven** — Desacoplamento através de eventos de domínio
- **CQRS leve** — Separação entre comandos (escrita) e queries (leitura)
- **Repository Pattern** — Abstração de persistência
- **SOLID** — Especialmente Single Responsibility e Dependency Inversion
