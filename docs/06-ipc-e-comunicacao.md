# 06 — IPC e Comunicação Frontend/Backend

## 6.1 Organização dos Comandos Tauri

Nunca coloque toda a lógica em um único arquivo `commands.rs`. Organize por domínio:

```
presentation/ipc/
├── instance.rs     # create_instance, delete_instance, rename_instance, get_instances
├── java.rs         # install_java, detect_java, get_java_versions
├── download.rs     # start_download, cancel_download, get_download_progress
├── settings.rs     # get_settings, save_settings
├── launcher.rs     # launch_minecraft, stop_minecraft, get_console_output
└── minecraft.rs    # get_versions, install_version, get_assets
```

## 6.2 Cada Comando Deve Ser Fino

```rust
// ❌ Ruim: comando faz tudo
#[tauri::command]
fn install_version(version: String) -> Result<(), String> { ... }

// ✅ Bom: delega para caso de uso
#[tauri::command]
async fn install_version(version: String, state: State<AppState>) -> Result<(), AppError> {
    let use_case = state.install_version_use_case();
    use_case.execute(InstallVersionCommand { version }).await?;
    Ok(())
}
```

## 6.3 Frontend: API Client

Nunca chame `invoke()` diretamente no componente. Crie uma camada de API:

```
src/lib/api/
├── instance.ts    # InstanceAPI.create(), InstanceAPI.list(), InstanceAPI.delete()
├── java.ts        # JavaAPI.install(), JavaAPI.detect()
├── launcher.ts    # LauncherAPI.launch(), LauncherAPI.stop()
├── settings.ts    # SettingsAPI.get(), SettingsAPI.save()
└── minecraft.ts   # MinecraftAPI.getVersions(), MinecraftAPI.installVersion()
```

```typescript
// ✅ Bom: encapsulado no serviço
const instance = await InstanceAPI.create({ name: "Minha Instância", version: "1.20.4" });

// ❌ Ruim: invoke direto no componente
const instance = await invoke("create_instance", { name: "Minha Instância", version: "1.20.4" });
```

## 6.4 Eventos (Tauri Events)

Use eventos Tauri para comunicação assíncrona:

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `download:progress` | Backend → Frontend | Progresso de download |
| `minecraft:output` | Backend → Frontend | Linha do console do jogo |
| `minecraft:started` | Backend → Frontend | Jogo iniciou |
| `minecraft:exited` | Backend → Frontend | Jogo fechou |
| `java:install-progress` | Backend → Frontend | Progresso de instalação Java |

## 6.5 Tipos Compartilhados

Defina tipos no frontend que espelham os DTOs do backend:

```typescript
// types/instance.ts
export interface InstanceDTO {
    id: string;
    name: string;
    version: string;
    loader: string | null;
    icon_path: string | null;
    created_at: string;
    last_played: string | null;
}
```

Use `serde` no Rust e mantenha os nomes dos campos consistentes entre as camadas.
