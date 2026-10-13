# 13 — Especificação Funcional: Seed Map

> ✅ **P0 implementado** (2026-08-27): engine via FFI manual contra o Cubiomes (vendorizado em `src-tauri/vendor/cubiomes/`, sem depender dos crates `cubiomes`/`cubiomes-sys` — eles têm um bug real de incompatibilidade de bindings nesse toolchain Windows). `WorldgenService` (`infrastructure/worldgen/`), 4 commands (`generate_biome_tile`, `list_biome_palette`, `get_spawn_point`, `list_slime_chunks`) e o mapa em canvas (`SeedMapTab.tsx`) com zoom/pan/tiles/camadas Biomas+Spawn+Slime Chunk já funcionam. P1–P3 (estruturas, marcadores, busca customizada) seguem como próximos passos.

> Inventário do que a aba **Seed Map** (`SeedMapTab.tsx`, hoje "Em construção") precisa oferecer para chegar perto da referência do mercado (Chunkbase Seed Map), adaptado ao escopo do AstroLauncher: **somente Minecraft Java Edition**, sem Bedrock. Este documento é uma especificação de funcionalidades, não um plano de implementação linha a linha — é o "o quê", a arquitetura de como construir fica em [09 — Evoluções Futuras](09-evolucoes-futuras.md).

## 13.1 Escopo e não-escopo

- **Dentro do escopo:** geração local de mapa de biomas e estruturas para mundos **Java Edition**, a partir da seed de uma instância existente no launcher.
- **Fora do escopo:** Bedrock Edition (o AstroLauncher só lança Java Edition — Fabric/Quilt/Forge/NeoForge/LiteLoader são todos loaders Java).
- **Engine:** processamento 100% local (sem depender de nenhum serviço de terceiro), via [Cubiomes](https://github.com/Cubitect/cubiomes) (C, MIT) — ver decisão de arquitetura em [09.4](09-evolucoes-futuras.md#94-como-a-arquitetura-facilita).
- **Propriedade intelectual:** este documento descreve _funcionalidade observável_ de uma ferramenta de mercado (Chunkbase), não autoriza copiar código, bundles, sprites, layout ou assets de terceiros. Implementação, ícones e engine devem ser independentes.

## 13.2 Entrada de dados

Diferente de uma ferramenta web genérica, o AstroLauncher já sabe qual é a instância/mundo em edição — a UX deve aproveitar isso em vez de pedir tudo manualmente:

| Campo               | Origem no AstroLauncher                                                         | Observação                                                                                      |
| ------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Seed                | Lida automaticamente do `level.dat` do mundo selecionado (aba Worlds já existe) | Editável manualmente para consultar outra seed sem precisar de um mundo salvo                   |
| Versão do Minecraft | Derivada de `instance.version`                                                  | Sobrescrita manual permitida (mundo pode ter regiões geradas em versões diferentes após update) |
| Edição              | Sempre Java (fixo, não é seletor)                                               | —                                                                                               |
| Dimensão            | Overworld / Nether / End                                                        | Troca de dimensão recalcula/reconsulta o provider                                               |

Um mundo iniciado numa versão e atualizado depois pode ter regiões geradas em versões diferentes — a UI deve deixar claro que a versão selecionada afeta a consulta, não necessariamente a versão "oficial" da instância.

## 13.3 Versionamento

Cada versão do Minecraft pode alterar camadas de bioma, ruído, altura do mundo, regras de estrutura e salts. A versão não deve ser só uma string repassada pra engine — deve ser um perfil de capacidades:

```
WorldVersion → EditionProfile (sempre Java) → DimensionEngine → BiomeProvider / StructureProvider / TerrainEstimator
```

O Cubiomes já cobre nativamente de **Beta 1.7 até a versão mais recente** (o próprio `enum MCVersion` da lib abstrai internamente a diferença entre o sistema de layers antigo, pré-1.18, e o de noise moderno) — não há motivo pra restringir versão mínima artificialmente. A validação de versão só deve rejeitar uma string que não corresponda a nenhum valor do enum (versão realmente desconhecida/não parseável), não por ser "antiga". (Correção: a primeira versão deste doc limitava a P0 em 1.18+ por excesso de cautela — não era uma limitação real do Cubiomes.)

| Faixa      | Observação                                                |
| ---------- | ---------------------------------------------------------- |
| B1.7–1.21+ | Suportado nativamente pelo Cubiomes                         |
| Snapshots  | Tratar como canal experimental separado, nunca como padrão |

## 13.4 Camadas de biomas e estruturas (painel de features)

Painel com ativação individual por camada, + ações **Selecionar todas** / **Desmarcar todas** (componente já existe no projeto — reusar o padrão de `Select all`/`Deselect all` do resto do app, ex. seleção em lote de mods).

| Categoria                | Itens                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Base                     | Biomas, Ponto de Spawn, Slime Chunk                                                                                                       |
| Estruturas de superfície | Village, Woodland Mansion, Pillager Outpost, Desert Temple, Jungle Temple, Witch Hut, Desert Well, Trail Ruins, Ruined Portal (Overworld) |
| Estruturas subterrâneas  | Ancient City, Dungeon, Stronghold, Mineshaft, Trial Chamber, Fossil                                                                       |
| Estruturas aquáticas     | Ocean Monument, Shipwreck, Ocean Ruins                                                                                                    |
| Recursos/formações       | Buried Treasure, Igloo, Cheese Cave, Ravine, Underground Lava Pool, Amethyst Geode, Ore Veins, Enchanted Golden Apple                     |

Total: 3 camadas base + 26 estruturas/recursos = 29 camadas.

Comportamento esperado:

- Ícone próprio por camada (não reusar sprite de terceiro — usar lucide-react ou ícones desenhados, seguindo `src/data/mc-icons.ts` como referência de padrão já usado no projeto para texturas do jogo).
- Camadas com muitos resultados podem ficar ocultas em zoom muito distante (evitar poluição visual), com aviso tipo "Aproxime para ver todas as camadas selecionadas".
- Estado inicial de camadas ativas é uma escolha de produto, não um contrato fixo — pode ser persistido em `localStorage`/`sessionCache` (ver [09.4](09-evolucoes-futuras.md)) por usuário.

## 13.5 Mapa

- Renderização em canvas (ou WebGL se necessário para performance).
- **Zoom in/out** (botões + gesto de roda/pinça).
- **Pan** (arrastar), com opção de "momentum panning" (desliza suavemente após soltar).
- **Rotação** opcional (reset + atalho de teclado/gesto) — nice-to-have, não bloqueante pra primeira versão.
- **Expandir mapa** (tela cheia dentro da aba).
- **Grid Lines** (linhas de chunk/região, toggle).
- **Terrain**: ajuste visual pra aproximar a costa/relevo exibido do relevo real (bioma abstrato ≠ terreno real em 1.18+) — não é simulação de bloco a bloco, só correção visual.
- **Geração por tiles sob demanda** (não gerar o mapa inteiro de uma vez): cada tile identificado por seed+versão+dimensão+zoom+coordenadas, cache de tiles já calculados, cancelamento de tiles fora da viewport ao navegar.

## 13.6 Navegação e busca

| Recurso                             | Descrição                                                                                                                                                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Campos X / Z + botão "Ir"           | Pula a visualização pra uma coordenada digitada                                                                                                                                                                                                                         |
| Busca simples                       | Lista estruturas/biomas mais próximos da posição atual, navega entre resultados                                                                                                                                                                                         |
| Busca customizada                   | Combinação de critérios: biomas próximos, estruturas próximas, distância/relação espacial entre múltiplos alvos (ex.: "duas witch huts próximas o bastante pra compartilhar área de farm", "aldeia perto de cherry grove e taiga") — feature avançada, prioridade baixa |
| Copiar coordenada com comando `/tp` | Opção em configurações avançadas                                                                                                                                                                                                                                        |

## 13.7 Biomas — controles específicos

- Toggle de camada de biomas (cores por bioma).
- **Highlight Biomes**: destaque visual separado da exibição simples da camada.
- **Altura do bioma**: `Surface` (superfície) / `Underground` (subterrâneo/cavernas) / `Bottom` (~Y -51) — importante em versões modernas onde bioma de superfície diverge do bioma em profundidade.

## 13.8 Exibição de estruturas

- Alternância **Ícones** ↔ **Pontos** (pontos reduzem poluição visual e custo de renderização em mapas com muita camada ativa).

## 13.9 Compartilhamento e persistência

- Estado do mapa (seed, versão, dimensão, X/Z, zoom, camadas ativas) refletido numa forma compartilhável — no desktop isso pode ser um link `astrolauncher://` (se o app já tiver esse tipo de handler, checar `AstropackFileAssociationBridge` como precedente) ou simplesmente um JSON exportável, não necessariamente uma URL web.
- **Marcadores customizados** por clique/toque prolongado: temporário até salvar, com nome e cor; editar/apagar depois.
- **Local concluído**: marcar uma estrutura como "já visitei/já usei", ícone fica semitransparente — útil como checklist de exploração.
- Persistência **local** (por instância, já que cada seed pertence a uma instância) — não depende de conta/nuvem. Exportar/importar esses dados junto do fluxo de AstroPack é uma extensão natural a considerar depois, não obrigatória na primeira versão.

## 13.10 Configurações avançadas (opcional, priorizar depois do núcleo)

| Opção                  | Efeito                                                                      |
| ---------------------- | --------------------------------------------------------------------------- |
| Momentum panning       | Mapa desliza e para suavemente após arrastar                                |
| Rotação do mapa        | Habilita gesto/atalho de rotação                                            |
| Fade-in de biomas      | Biomas aparecem gradualmente em vez de instantâneos                         |
| Cluster radius         | Agrupa ícones próximos num único marcador em zooms distantes                |
| Concorrência (workers) | Nº de threads/tasks paralelas gerando tiles — mais rápido, mais uso de CPU  |
| World border           | Limite navegável configurável (centro X/Z + tamanho), desenha borda no mapa |

## 13.11 Diagnóstico e dados

- Reset dos dados locais da feature (marcadores, progresso, preferências) — separado do reset geral do app.
- Exportar/importar dados locais (arquivo).

## 13.12 Limitações conhecidas a documentar na UI (herdadas do domínio, não do Chunkbase)

Geração de estrutura via Cubiomes calcula posição de tentativa + validação de bioma, mas **não é geração completa em nível de bloco** — falsos positivos são esperados em alguns casos. Avisos que a UI deve deixar explícitos (adaptado do que a própria referência de mercado documenta, sem os itens exclusivos de Bedrock):

| Estrutura                            | Limitação                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| Dungeons                             | Posição pode estar errada ou ausente                                                |
| World Spawn                          | Pode divergir da posição real                                                       |
| Amethyst Geode                       | Pode falhar perto de cavernas/mineshafts                                            |
| Desert/Jungle Temple                 | Pode falhar ou ser impreciso (depende de altura de terreno)                         |
| Enchanted Golden Apple               | Posição aproximada                                                                  |
| Village                              | Pode não gerar de fato no jogo mesmo aparecendo no mapa                             |
| Igloo                                | Pode falhar ocasionalmente                                                          |
| Fossil / Ruined Portal / Trail Ruins | Indicam só o centro do chunk — podem estar deslocados ~10–20 blocos da posição real |
| Coordenada Y                         | Nem toda estrutura expõe Y confiável                                                |
| Estruturas subterrâneas              | Podem exigir busca em diferentes alturas                                            |

A UI deve marcar resultados como posição **exata**, **aproximada** ou **tentativa não validada** (campo de origem/precisão no resultado), em vez de apresentar tudo com a mesma confiança.

## 13.13 Prioridade sugerida de implementação

| Fase   | Escopo                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------ |
| **P0** | Seed (lida da instância), versão, dimensão, mapa de biomas por tiles, zoom/pan, X/Z + Go                                 |
| **P0** | Ativação individual de camadas base (Biomas, Spawn, Slime Chunk), modo ícones/pontos                                     |
| **P1** | Estruturas principais: Village, Stronghold, Ocean Monument, Pillager Outpost, Woodland Mansion, Mineshaft, Ruined Portal |
| **P1** | Grid Lines, Terrain, Highlight Biomes, altura do bioma (Surface/Underground/Bottom)                                      |
| **P1** | Cache de tiles por seed/versão/dimensão, busca simples por proximidade                                                   |
| **P2** | Marcadores customizados, locais concluídos, restante das 26 camadas de estrutura/recurso                                 |
| **P2** | Exportar/importar dados locais da feature                                                                                |
| **P3** | Busca customizada com múltiplos critérios, rotação de mapa, momentum panning, world border configurável                  |

## 13.14 Onde isso entra na arquitetura atual

- Nova aba já existe: `src/features/instances/components/edit-instance/SeedMapTab.tsx` (hoje placeholder).
- Backend: novo módulo `infrastructure/worldgen/` (Cubiomes via FFI/wrapper Rust), use cases de geração de tile/consulta de feature em `application/use_cases/`, seguindo o mesmo padrão CQRS-lite do resto do projeto (ver [02 — Arquitetura](02-arquitetura.md)).
- Comandos Tauri assíncronos e canceláveis (gerar tile de viewport, buscar estrutura próxima), eventos de progresso via `app.emit`, mesmo padrão de `launch://event`/`modpack://event` (ver [06 — IPC e Comunicação](06-ipc-e-comunicacao.md)).
- Sem dependência de rede para a geração em si — só a seed do mundo local, já lida pela instância.
