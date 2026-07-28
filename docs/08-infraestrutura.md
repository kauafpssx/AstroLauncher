# 08 — Módulos de Infraestrutura

## 8.1 Download Manager

Módulo dedicado para downloads robustos:

```
infrastructure/downloader/
├── manager.rs        # Gerencia fila de downloads
├── queue.rs          # Fila com prioridade
├── worker.rs         # Workers paralelos
├── progress.rs       # Tracking de progresso
├── retry.rs          # Retry com backoff
├── checksum.rs       # Verificação SHA1
└── events.rs         # Eventos de download
```

- Suporte a download paralelo (N workers configurável)
- Retry automático com exponential backoff
- Verificação de checksum (SHA1 dos assets Mojang)
- Resumo de conexões interrompidas
- Progresso emitido via eventos Tauri

## 8.2 Process Manager

```
infrastructure/process/
├── launcher.rs       # Spawn do processo Java
├── monitor.rs        # Monitora processo em execução
├── stdout.rs         # Leitura não-bloqueante do stdout
├── stderr.rs         # Leitura não-bloqueante do stderr
└── kill.rs           # Encerramento graceful e forçado
```

- Spawn com argumentos construídos pelo LaunchService
- Pipe de stdout/stderr para o frontend via eventos
- Detecção de crash (exit code != 0)
- Timeout de inicialização
- Kill com fallback (graceful → forcado)

## 8.3 Java Manager

```
infrastructure/java/
├── detector.rs       # Detecta JREs instalados no sistema
├── installer.rs      # Instala JREs da Microsoft/Adoptium
├── runtime.rs        # Gerenciamento de runtimes baixados
├── validator.rs      # Valida versão e arquitetura do Java
├── download.rs       # Download de runtimes
└── version.rs        # Parsing de versões Java
```

- Detecção automática via PATH e registros do sistema
- Download da API Adoptium (Eclipse Temurin)
- Validação de compatibilidade (Java 17+ para Minecraft 1.18+)
- Múltiplas versões instaladas simultaneamente

## 8.4 Minecraft Manager

```
infrastructure/minecraft/
├── manifest.rs       # Fetch do version manifest (launchermeta.mojang.com)
├── assets.rs         # Download e indexação de assets
├── libraries.rs      # Resolução e download de libraries
├── versions.rs       # Gerenciamento de versões locais
├── client.rs         # Download do client jar
├── launcher.rs       # Construção do launch command
├── rules.rs          # Avaliação de regras (allow/disallow)
├── version_type.rs   # Filtros por tipo (release, snapshot, alpha, beta, etc.)
└── old_versions.rs   # Suporte a versões antigas (infdev, classic, indev)
```

- Integração com `mc-launcher-core` para operações de baixo nível
- Cache de manifestos (evita fetching desnecessário)
- Parsing das regras de bibliotecas (OS, arch, features)
- **Suporte a todas as versões:** o manifesto da Mojang inclui versões desde 2009. O filtro `version_type` separa por releases, snapshots, alphas (1.0.0 → 1.0.16), betas (1.0_01 → 1.8.1), infdev, classic, indev e vintage.
- Versões antigas têm estrutura de assets diferente (pré-1.6, pós-1.6, pós-1.7.10). O `old_versions.rs` lida com cada caso.

## 8.5 Persistência

```
infrastructure/persistence/
├── migrations/                  # Migrações SQLite versionadas
├── sqlite/                      # Conexão e setup do banco
├── repositories/                # Implementações SQLite das traits
│   ├── sqlite_instance_repository.rs
│   ├── sqlite_folder_repository.rs
│   ├── sqlite_playtime_repository.rs
│   └── sqlite_account_repository.rs
├── config/                      # Configs em JSON (editáveis pelo user)
│   ├── json_settings_repository.rs
│   └── json_java_repository.rs
└── cache/                       # Cache em arquivos com TTL
    ├── manifest_cache.rs
    └── search_cache.rs
```

**Decisão:** SQLite para dados estruturados (instâncias, pastas, playtime, contas, mods). JSON apenas para configurações editáveis pelo usuário (`settings.json`, `java.json`). Cache em arquivos com TTL.

Ver [documento 12 — Armazenamento](12-armazenamento.md) para schema completo e justificativas.

## 8.6 Cache

```
infrastructure/cache/
├── asset_cache.rs         # Cache de objetos de assets
├── manifest_cache.rs       # Cache de manifests
├── library_cache.rs        # Cache de bibliotecas
└── metadata_cache.rs       # Cache genérico com TTL
```

- Assets cacheados por hash (SHA1)
- Manifestos com cache de 1 hora
- Verificação de integridade no cache hit
- Limpeza automática de cache expirado

## 8.7 Playtime

```
infrastructure/playtime/
├── tracker.rs            # Cronômetro em tempo real (inicia no launch, para no exit)
├── repository.rs         # Persistência em SQLite
├── calculator.rs         # Soma por instância e total
└── events.rs             # Eventos de sessão
```

- **Playtime tracker** inicia quando o Minecraft abre, para quando fecha
- Salva sessões individuais na tabela `playtime_sessions` (SQLite)
- Cálculo de total por instância via `SUM(duration_seconds)` e total geral
- Instância também tem `playtime_seconds` denormalizado para acesso rápido na listagem
- Evento `PlaytimeTick` a cada 60s para atualizar o frontend em tempo real
- Dados exibidos no card da instância e em uma página de estatísticas

## 8.8 CurseForge API

```
infrastructure/curseforge/
├── client.rs             # HTTP client para CF Core API
├── search.rs             # Busca de modpacks e mods
├── modpack.rs            # Detalhes do modpack
├── file.rs               # Manifest e arquivos do modpack
├── install.rs            # Download e instalação do modpack
└── mapper.rs             # Conversão CF -> Domain entities
```

- Usa **CurseForge Core API** (requer API key)
- Cache de resultados de busca (evita rate limit)
- Download de modpacks seguindo o `manifest.json` (formato CF)
- Resolução de dependências inclusas no modpack
- Filtro por versão do Minecraft e loader
- Instalaçãocria uma nova instância ou adiciona a uma existente

## 8.9 Modrinth API

```
infrastructure/modrinth/
├── client.rs             # HTTP client para Modrinth API (v3)
├── search.rs             # Busca de projetos
├── project.rs            # Detalhes do projeto
├── version.rs            # Versões e arquivos
├── install.rs            # Download e instalação
└── mapper.rs             # Conversão Modrinth -> Domain entities
```

- Usa **Modrinth API v3** (aberta, sem necessidade de key)
- Suporte a busca com filtros (loader, versão, categoria, tipo: mod/modpack/shader)
- Download do arquivo primário da versão selecionada
- Instalação como nova instância (modpacks) ou adição a instância existente (mods)
- Cache de resultados com TTL

## 8.10 Folder Persistence

```
infrastructure/persistence/
├── sqlite/
│   ├── connection.rs
│   └── migration_runner.rs
├── repositories/
│   ├── sqlite_instance_repository.rs    # Instâncias com folder_id
│   ├── sqlite_folder_repository.rs      # Pastas
│   ├── sqlite_playtime_repository.rs    # Sessões de playtime
│   └── sqlite_account_repository.rs     # Contas
├── config/
│   ├── json_settings_repository.rs      # Configs do launcher
│   └── json_java_repository.rs          # Runtimes Java detectados
└── cache/
    ├── manifest_cache.rs
    └── search_cache.rs
```

- Pastas na tabela `folders` (SQLite) com `id`, `name`, `position`, `collapsed`
- Cada instância tem `folder_id` opcional (null = sem pasta)
- Pastas têm `position` para ordenação personalizada e `collapsed` para estado recolhido
- Playtime na tabela `playtime_sessions` com índice por `instance_id` e `started_at`
