# 09 — Evoluções Futuras

Se a base arquitetural for seguida desde o início, adicionar novas funcionalidades será principalmente criar novos módulos e casos de uso, sem alterar o restante da aplicação.

> ✅ Já implementado (não mais "futuro"): Forge/NeoForge, LiteLoader, playtime tracking, pastas, Mod Browser (Modrinth + CurseForge), AstroPack, editor de config/keybinds, notas, ícones customizados, visualizador de skins 3D, Discord RPC, auto-update (plugin-updater), sugestão de memória, idioma automático, persistência de janela, rede ZeroTier, Java por instância, janela do jogo configurável e avatares de conta (todos até v0.6.0).

## 9.1 Curto Prazo

| Funcionalidade                                                                     | Esforço | Impacto |
| ---------------------------------------------------------------------------------- | ------- | ------- |
| Sistema de plugins do launcher                                                     | Alto    | Alto    |
| Retry/backoff no download manager (sem dependência de retry hoje — código próprio) | Baixo   | Médio   |
| Autenticação Microsoft oficial                                                     | Alto    | Alto    |
| Cache de manifests/buscas (Modrinth/CurseForge)                                    | Médio   | Médio   |
| Temas e personalização da interface                                                | Baixo   | Médio   |

## 9.2 Médio Prazo

| Funcionalidade                      | Esforço | Impacto |
| ----------------------------------- | ------- | ------- |
| Sincronização de instâncias (nuvem) | Alto    | Médio   |
| Canal Beta/Stable para atualizações | Médio   | Médio   |
| Marketplace de recursos             | Alto    | Alto    |

## 9.3 Longo Prazo

| Funcionalidade                                     | Esforço | Impacto |
| -------------------------------------------------- | ------- | ------- |
| Otimização de assets (compressão)                  | Alto    | Médio   |
| Estatísticas de uso avançadas (gráficos)           | Médio   | Baixo   |
| Modo quiosque / parental control                   | Médio   | Baixo   |
| Suporte a login com importação de outros launchers | Alto    | Médio   |

## 9.4 Como a Arquitetura Facilita

- **Plugins:** Basta definir uma trait `LauncherPlugin` no domínio e carregar dinamicamente na Application Layer
- **Auth Microsoft:** Novo módulo em `infrastructure/` implementando um trait de autenticação, plugado na `AccountRepository` existente
- **Sincronização:** Novo módulo `sync/` na infrastructure com repositório remoto
- **Temas:** Apenas frontend (CSS variables via shadcn/ui), sem impacto no backend
- **Novos loaders:** `infrastructure/modloader/` já segue um padrão por loader (`fabric_like.rs`, `forge_like.rs`, `liteloader.rs`) — adicionar um novo é criar mais um arquivo nesse padrão

## 9.5 O Que NÃO Mudaria

- Estrutura de camadas (Domain, Application, Infrastructure, Presentation)
- Organização feature-first no frontend
- Repository Pattern (trocar SQLite por PostgreSQL no futuro é transparente — só muda a implementação)
- Convenção CQRS-lite (use cases de leitura e escrita em structs separadas, um `execute()` por ação)
- Tamanho máximo de arquivos (200 linhas)
