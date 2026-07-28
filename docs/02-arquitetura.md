# 02 — Arquitetura Técnica

## 2.1 Visão em Camadas

```
React UI
    │
    ▼ invoke()
Tauri Commands (IPC)
    │
    ▼
Application Layer (Use Cases, DTOs, Commands, Queries)
    │
    ▼
Domain Layer (Entities, Value Objects, Traits, Services)
    │
    ▼
Infrastructure Layer (Minecraft, Java, FileSystem, Network, Cache, Process)
```

**Regra fundamental:** A UI nunca conversa diretamente com Infrastructure. Ela conversa apenas com Use Cases expostos via Tauri Commands.

## 2.2 Fluxo de Execução

```
React UI → Feature Component → API Client (invoke) → Tauri Command
    → Use Case → Domain Service → Repository (trait)
    → Infrastructure Implementation
    → FileSystem / mc-launcher-core / Java / Network
```

## 2.3 Responsabilidades por Camada

### 2.3.1 Presentation (Tauri Commands)
- Recebe chamadas IPC do frontend
- Converte DTOs para comandos/queries
- Delegar para Application Layer
- Retorna resultados serializáveis

### 2.3.2 Application Layer
- Casos de uso (orquestração)
- Commands e Queries
- DTOs e Mappers
- Eventos de aplicação
- Serviços de aplicação (transacionais)

### 2.3.3 Domain Layer
- Entidades e Value Objects
- Traits (interfaces de repositório)
- Serviços de domínio (regras de negócio)
- Eventos de domínio
- Erros de domínio

### 2.3.4 Infrastructure Layer
- Implementações concretas de repositórios
- Download Manager
- Process Manager
- Java Manager
- Minecraft API Client
- Cache e persistência
- Sistema de arquivos

### 2.3.5 Shared
- Configurações globais
- Logger estruturado
- Utilitários por contexto (path, hash, zip, json)
- Constantes e macros
- Erros compartilhados

## 2.4 Princípios de Design

- **Dependency Inversion:** Domain define traits; Infrastructure implementa
- **Composição sobre herança:** Rust favorece composição naturalmente
- **Imutabilidade por padrão:** Estado mutável apenas quando necessário
- **Fail fast:** Erros são modelados como tipos, não strings
- **Testabilidade:** Domain e Application não dependem de I/O
