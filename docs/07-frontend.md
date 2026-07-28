# 07 — Frontend (React + shadcn/ui)

## 7.1 Organização Feature-First

O frontend é organizado por features, não por tipos de arquivo:

```
src/features/instances/
├── components/      # InstanceCard, InstanceList, CreateInstanceDialog
├── hooks/           # useInstances, useInstanceActions
├── services/        # InstanceAPI
├── types/           # Instance, InstanceDTO, CreateInstanceInput
└── pages/           # InstancesPage, InstanceDetailPage
```

## 7.2 Componentes Compartilhados (shadcn/ui)

Componentes genéricos ficam em `src/components/ui/`:

```
components/ui/
├── button.tsx
├── card.tsx
├── dialog.tsx
├── input.tsx
├── select.tsx
├── tabs.tsx
├── badge.tsx
├── progress.tsx
├── scroll-area.tsx
└── ...
```

## 7.3 Stores (Zustand)

Cada domínio tem sua própria store:

```typescript
// stores/instance.store.ts
interface InstanceStore {
    instances: InstanceDTO[];
    selectedInstance: InstanceDTO | null;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    fetchInstances: () => Promise<void>;
    createInstance: (input: CreateInstanceInput) => Promise<void>;
    deleteInstance: (id: string) => Promise<void>;
    selectInstance: (instance: InstanceDTO) => void;
}
```

## 7.4 Hooks Customizados

Hooks encapsulam lógica de estado e API:

```typescript
// features/instances/hooks/useInstances.ts
export function useInstances() {
    const store = useInstanceStore();
    
    useEffect(() => {
        store.fetchInstances();
    }, []);
    
    return {
        instances: store.instances,
        isLoading: store.isLoading,
        error: store.error,
        createInstance: store.createInstance,
        deleteInstance: store.deleteInstance,
    };
}
```

## 7.5 Páginas Previstas

| Página | Rota | Descrição |
|--------|------|-----------|
| Instances | `/` | Lista de instâncias organizadas por pastas |
| Create Instance | `/instances/new` | Formulário de criação com seleção de versão (release, snapshot, alpha, etc.) |
| Instance Detail | `/instances/:id` | Detalhes, playtime, mods, ações de launch |
| Settings | `/settings` | Configurações do launcher |
| Java | `/java` | Gerenciamento de runtimes Java |
| Downloads | `/downloads` | Fila de downloads ativos |
| Console | `/console` | Log do Minecraft em tempo real |
| Modpacks | `/modpacks` | Busca e navegação de modpacks (CurseForge + Modrinth) |
| Modpack Detail | `/modpacks/:id` | Detalhes do modpack, versões, instalação |
| Playtime Stats | `/stats` | Estatísticas de tempo de jogo (por instância e total) |
| Versions Browser | `/versions` | Navegação por TODAS as versões do Minecraft (com filtros por tipo) |

## 7.6 Features no Frontend (Novas)

### 7.6.1 Playtime UI
- **InstanceCard:** badge com tempo total (ex: "12h 34m")
- **InstanceDetail:** gráfico de tempo por dia/semana/mês com `recharts`
- **StatsPage:** visão geral com total geral, instância mais jogada, média por sessão
- **Console:** timer visível durante o jogo (tempo da sessão atual)

### 7.6.2 Folder UI
- **Sidebar:** accordion com pastas recolhíveis, instâncias dentro
- **Drag & drop:** mover instância entre pastas (futuro)
- **Context menu:** criar, renomear, excluir pastas
- **Badge:** contador de instâncias por pasta

### 7.6.3 Version Browser UI
- **Filtros:** tabs/select para release, snapshot, alpha, beta, infdev, classic, indev
- **Card de versão:** nome, tipo, data de lançamento, loader compatível
- **Install button:** download direto da versão
- **Search:** busca por nome da versão

### 7.6.4 CurseForge / Modrinth UI
- **SearchPage:** barra de busca + filtros (loader, versão, categoria)
- **ResultCard:** thumbnail, nome, autor, downloads, loader badges
- **DetailPage:** descrição, screenshots, versões disponíveis, botão instalar
- **Install dialog:** escolher instância existente ou criar nova
- **Progress:** barra de progresso durante instalação do modpack

## 7.7 Layout

```
┌─────────────────────────────────┐
│         TopBar / Header         │
├──────────┬──────────────────────┤
│          │                      │
│ Sidebar  │     Main Content     │
│          │                      │
│ - Home   │                      │
│ - Mods   │                      │
│ - Java   │                      │
│ - Config │                      │
│ - Stats  │                      │
│ - Sobre  │                      │
│          │                      │
└──────────┴──────────────────────┘
```
