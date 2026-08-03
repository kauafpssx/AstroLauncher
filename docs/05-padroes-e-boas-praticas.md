# 05 — Padrões de Código e Boas Práticas

## 5.1 Princípios Gerais

- **SRP (Single Responsibility Principle):** Cada módulo, arquivo e função tem um único motivo para mudar.
- **DIP (Dependency Inversion Principle):** Domain define traits; Infrastructure implementa. Application orquestra.
- **Composição sobre herança:** Rust já favorece isso naturalmente.
- **Fail fast:** Use tipos de erro específicos (`Result<_, InstanceError>`), nunca `String`.
- **Imutabilidade por padrão:** Prefira `let` sobre `let mut`. Use `Arc`/`RwLock` apenas quando necessário.

## 5.2 Regras de Tamanho

| Artefato      | Limite Máximo | Ideal         |
| ------------- | ------------- | ------------- |
| Arquivo       | 200 linhas    | 80–150 linhas |
| Função        | 30 linhas     | 10–20 linhas  |
| Struct        | 5–7 campos    | 3–5 campos    |
| Enum de erros | 10 variantes  | 3–7 variantes |

## 5.3 Nomenclatura

- **Funções:** `install_java_runtime` (descritivo, verbo + substantivo)
- **Casos de uso:** `CreateInstanceUseCase` (PascalCase)
- **Entidades:** `Instance`, `JavaRuntime` (PascalCase)
- **Value Objects:** `InstanceName`, `JavaPath` (PascalCase)
- **Erros:** `InstanceNotFound`, `JavaNotInstalled` (PascalCase)
- **Eventos:** `InstanceCreated`, `MinecraftStarted` (PascalCase, passado)
- **Commands:** `CreateInstanceCommand` (PascalCase)
- **Queries:** `GetInstancesQuery` (PascalCase, Get prefix)
- **DTOs:** `InstanceDTO`, `LaunchConfigDTO` (PascalCase, DTO suffix)
- **Arquivos Rust:** `snake_case.rs`
- **Arquivos TypeScript:** `kebab-case.ts` ou `camelCase.ts`

## 5.4 Sobre Comentários

Comentários explicam **por que**, não **o que**. O código deve ser autoexplicativo.

```rust
// ❌ Ruim: explica o que o código faz
// Soma o total de downloads completados
let total = completed + pending;

// ✅ Bom: explica por que existe uma decisão não óbvia
// Mojang retorna 403 se não enviarmos User-Agent
client.header("User-Agent", "AstroLauncher/1.0");
```

## 5.5 Regras sobre Utilitários

**Nunca crie um `utils.rs` genérico.** Cada utilidade pertence ao seu contexto:

```
✅ path_utils.rs
✅ hash_utils.rs
✅ json_utils.rs
✅ zip_utils.rs
✅ java_utils.rs

❌ utils.rs
❌ helpers.rs
❌ common.rs
```

## 5.6 Service Pattern

Nunca crie serviços gigantes. Prefira serviços especializados:

```
❌ MinecraftService (faz tudo)
✅ VersionService
✅ ManifestService
✅ AssetService
✅ LibraryService
✅ LaunchService
✅ RuleService
```

## 5.7 Tratamento de Erros

- Erros de domínio são enums, não strings
- Use `thiserror` para definir erros
- Faça `From` impl para conversão entre camadas
- Nunca propague erros de infraestrutura para o domínio

```rust
#[derive(Debug, thiserror::Error)]
pub enum InstanceError {
    #[error("Instance '{0}' not found")]
    NotFound(String),
    #[error("Instance '{0}' already exists")]
    AlreadyExists(String),
    #[error("Invalid instance name: {0}")]
    InvalidName(String),
}
```

## 5.8 Testes

- Testes de unidade para regras de domínio
- Testes de caso de uso com repositórios mockados
- Testes de integração para infraestrutura
- Domínio nunca depende de I/O (rede, disco, processo)
- Use `mockall` ou traits para mockar dependências
