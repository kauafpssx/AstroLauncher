# 04 — Módulos e Domínios

## 4.1 Organização por Domínio

Cada módulo representa um domínio independente. Módulos são autocontidos e comunicam-se através de eventos e traits.

## 4.2 Estrutura de um Módulo

```
modulo/
├── entity.rs              # Entidade principal
├── value_objects.rs       # Value Objects
├── service.rs             # Serviço de domínio
├── repository.rs          # Trait do repositório
├── events.rs              # Eventos do domínio
├── commands.rs            # Commands (CQRS)
├── queries.rs             # Queries (CQRS)
├── dto.rs                 # Data Transfer Objects
├── mapper.rs              # Conversão entre camadas
├── errors.rs              # Erros específicos
└── mod.rs                 # Organização do módulo
```

**Regra:** Nenhum arquivo deve ultrapassar 200 linhas. O ideal é 80–150 linhas.

## 4.3 Catálogo de Módulos

### 4.3.1 `instance`
- **Entidade:** `Instance` (id, nome, versão, loader, path, ícone, config, folder_id, playtime)
- **Serviços:** `InstanceService`, `InstanceValidator`
- **Eventos:** `InstanceCreated`, `InstanceDeleted`, `InstanceRenamed`, `InstanceLaunched`

### 4.3.2 `minecraft`
- **Entidades:** `VersionManifest`, `Version`, `AssetIndex`, `Library`, `VersionType` (enum: release, snapshot, alpha, beta, infdev, classic, indev, etc.)
- **Serviços:** `VersionService`, `ManifestService`, `AssetService`, `LibraryService`, `RuleEvaluator`
- **Eventos:** `VersionInstalled`, `AssetsDownloaded`, `VersionRemoved`

### 4.3.3 `java`
- **Entidades:** `JavaRuntime`, `JavaVersion`
- **Serviços:** `JavaDetector`, `JavaInstaller`, `JavaValidator`
- **Eventos:** `JavaInstalled`, `JavaDetected`, `JavaValidationFailed`

### 4.3.4 `launcher`
- **Entidades:** `LaunchConfig`, `ProcessHandle`
- **Serviços:** `LaunchService`, `ArgumentBuilder`, `ProcessMonitor`
- **Eventos:** `MinecraftStarted`, `MinecraftExited`, `MinecraftCrashed`, `MinecraftOutput`

### 4.3.5 `download`
- **Entidades:** `DownloadTask`, `DownloadQueue`
- **Serviços:** `DownloadManager`, `RetryService`, `ChecksumValidator`
- **Eventos:** `DownloadStarted`, `DownloadProgress`, `DownloadCompleted`, `DownloadFailed`

### 4.3.6 `accounts`
- **Entidades:** `Account`, `OfflineAccount`
- **Serviços:** `AuthService`, `SessionService`
- **Eventos:** `AccountLoggedIn`, `AccountLoggedOut`

### 4.3.7 `settings`
- **Entidades:** `LauncherConfig`, `JavaConfig`, `MinecraftConfig`
- **Serviços:** `SettingsService`, `ConfigValidator`
- **Eventos:** `SettingsChanged`

### 4.3.8 `modloader`
- **Entidades:** `Loader`, `FabricLoader`, `QuiltLoader`
- **Serviços:** `LoaderInstaller`, `LoaderResolver`
- **Eventos:** `LoaderInstalled`, `LoaderRemoved`

### 4.3.9 `assets`
- **Entidades:** `Asset`, `AssetObject`
- **Serviços:** `AssetDownloader`, `AssetIndexer`
- **Eventos:** `AssetIndexDownloaded`, `AssetObjectDownloaded`

### 4.3.10 `libraries`
- **Entidades:** `Library`, `LibraryArtifact`
- **Serviços:** `LibraryResolver`, `LibraryDownloader`, `LibraryValidator`
- **Eventos:** `LibraryDownloaded`, `LibraryVerificationFailed`

### 4.3.11 `runtime`
- **Entidades:** `JavaRuntime`, `RuntimeManifest`
- **Serviços:** `RuntimeService`, `RuntimeInstallService`

### 4.3.12 `logs`
- **Entidades:** `LogEntry`, `LogSession`
- **Serviços:** `LogService`, `LogFormatter`
- **Eventos:** `LogEntryWritten`

### 4.3.13 `playtime`
- **Entidades:** `PlaytimeEntry`, `PlaytimeSummary` (total por instância, total geral)
- **Value Objects:** `SessionDuration`, `LastPlayed`
- **Serviços:** `PlaytimeTracker` (inicia/para cronômetro), `PlaytimeCalculator`
- **Repositório:** `PlaytimeRepository`
- **Eventos:** `PlaytimeTick` (a cada minuto), `SessionStarted`, `SessionEnded`

### 4.3.14 `folder`
- **Entidades:** `Folder` (id, nome, posição, collapsed)
- **Serviços:** `FolderService`, `FolderValidator`
- **Repositório:** `FolderRepository`
- **Eventos:** `FolderCreated`, `FolderDeleted`, `FolderRenamed`, `InstanceMovedToFolder`

### 4.3.15 `curseforge`
- **Entidades:** `CurseForgeModpack`, `CurseForgeMod`, `CurseForgeFile`, `CurseForgeCategory`
- **Serviços:** `CurseForgeApiClient`, `CurseForgeSearchService`, `CurseForgeInstallService`
- **Eventos:** `ModpackInstallStarted`, `ModpackInstallProgress`, `ModpackInstalled`, `ModpackInstallFailed`

### 4.3.16 `modrinth`
- **Entidades:** `ModrinthProject`, `ModrinthVersion`, `ModrinthFile`, `ModrinthCategory`
- **Serviços:** `ModrinthApiClient`, `ModrinthSearchService`, `ModrinthInstallService`
- **Eventos:** `ModrinthInstallStarted`, `ModrinthInstallProgress`, `ModrinthInstalled`, `ModrinthInstallFailed`

## 4.4 Casos de Uso

Cada caso de uso faz exatamente uma coisa:

| Caso de Uso | Ação |
|-------------|------|
| `CreateInstanceUseCase` | Cria uma nova instância |
| `DeleteInstanceUseCase` | Remove uma instância |
| `RenameInstanceUseCase` | Renomeia uma instância |
| `LaunchInstanceUseCase` | Inicia o Minecraft para uma instância |
| `InstallVersionUseCase` | Baixa e instala uma versão do Minecraft |
| `InstallJavaUseCase` | Baixa e instala um runtime Java |
| `InstallLoaderUseCase` | Instala Fabric/Quilt em uma instância |
| `DownloadAssetsUseCase` | Baixa assets de uma versão |
| `ResolveLibrariesUseCase` | Resolve e baixa bibliotecas |
| `LoadInstancesUseCase` | Carrega lista de instâncias |
| `SaveSettingsUseCase` | Salva configurações |
| `StartPlaytimeSessionUseCase` | Inicia cronômetro de playtime |
| `EndPlaytimeSessionUseCase` | Para cronômetro e salva tempo |
| `GetPlaytimeSummaryUseCase` | Retorna playtime por instância e total |
| `CreateFolderUseCase` | Cria uma pasta de instâncias |
| `DeleteFolderUseCase` | Remove uma pasta |
| `RenameFolderUseCase` | Renomeia uma pasta |
| `MoveInstanceToFolderUseCase` | Move instância entre pastas |
| `SearchCurseForgeUseCase` | Busca modpacks no CurseForge |
| `InstallCurseForgeModpackUseCase` | Baixa e instala modpack do CurseForge |
| `SearchModrinthUseCase` | Busca mods/modpacks no Modrinth |
| `InstallModrinthProjectUseCase` | Baixa e instala projeto do Modrinth |
| `FetchAllVersionsUseCase` | Obtém todas as versões (releases, snapshots, alphas, betas) |
