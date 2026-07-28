# 09 — Evoluções Futuras

Se a base arquitetural for seguida desde o início, adicionar novas funcionalidades será principalmente criar novos módulos e casos de uso, sem alterar o restante da aplicação.

## 9.1 Curto Prazo

| Funcionalidade | Esforço | Impacto |
|----------------|---------|---------|
| Sistema de plugins do launcher | Alto | Alto |
| Suporte a Forge/NeoForge | Médio | Alto |
| Download paralelo inteligente | Médio | Alto |
| Temas e personalização da interface | Baixo | Médio |
| Verificação de integridade por hash | Médio | Alto |

## 9.2 Médio Prazo

| Funcionalidade | Esforço | Impacto |
|----------------|---------|---------|
| Contas Microsoft (auth oficial) | Alto | Alto |
| Sincronização de instâncias (nuvem) | Alto | Médio |
| Canal Beta/Stable para atualizações | Médio | Médio |
| Marketplace de recursos | Alto | Alto |
| Atualizações automáticas do launcher | Médio | Alto |

## 9.3 Longo Prazo

| Funcionalidade | Esforço | Impacto |
|----------------|---------|---------|
| Otimização de assets (compressão) | Alto | Médio |
| Estatísticas de uso avançadas (gráficos) | Médio | Baixo |
| Modo quiosque / parental control | Médio | Baixo |
| Suporte a login com importação de outros launchers | Alto | Médio |

## 9.4 Como a Arquitetura Facilita

- **Plugins:** Basta definir uma trait `LauncherPlugin` no domínio e carregar dinamicamente na Application Layer
- **Auth Microsoft:** Novo módulo `accounts/microsoft.rs` implementando a trait `AuthProvider`
- **Sincronização:** Novo módulo `sync/` na infrastructure com repositório remoto
- **Temas:** Apenas frontend (CSS variables via shadcn/ui), sem impacto no backend
- **Forge/NeoForge:** A infraestrutura de `modloader` já está preparada para novos loaders

## 9.5 O Que NÃO Mudaria

- Estrutura de camadas (Domain, Application, Infrastructure, Presentation)
- Organização feature-first no frontend
- Repository Pattern (trocar SQLite por PostgreSQL no futuro é transparente — só muda a implementação)
- Event Driven (novos eventos não quebram handlers existentes)
- CQRS leve (commands e queries separados)
- Tamanho máximo de arquivos (200 linhas)
