import {
  AlertTriangle,
  Download,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import {
  EntityContextMenu,
  type ContextMenuAction,
} from '@/components/common/EntityContextMenu'
import { SearchInput } from '@/components/common/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'
import type { ModSortBy, ModSource } from '@/types/mods'

import type { useModBrowser } from './useModBrowser'
import { selectionKey } from './useModBrowser'

const SOURCES: { id: ModSource; label: string; logo: string }[] = [
  { id: 'modrinth', label: 'Modrinth', logo: '/providers/modrinth.svg' },
  { id: 'curseforge', label: 'CurseForge', logo: '/providers/curseforge.png' },
]

const SORT_OPTIONS: { value: ModSortBy; label: string }[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'updated', label: 'Atualizados' },
]

interface ModBrowserListProps {
  browser: ReturnType<typeof useModBrowser>
}

export function ModBrowserList({ browser }: ModBrowserListProps) {
  const {
    source,
    setSource,
    query,
    setQuery,
    sortBy,
    setSortBy,
    results,
    isSearching,
    error,
    viewing,
    setViewing,
    selection,
    setView,
    isUploading,
    pendingKeys,
    installedKeys,
    selectedCount,
    kindLabel,
    toggleSelection,
    handleUploadCustom,
    handleDeleteInstalled,
  } = browser

  return (
    <div className="flex h-full min-w-0 flex-col border-r">
      <div className="flex items-center gap-2 border-b p-3">
        <SearchInput
          containerClassName="flex-1"
          placeholder={`Buscar ${kindLabel.toLowerCase()}...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <ToggleGroup
          type="single"
          value={source}
          onValueChange={(v) => v && setSource(v as ModSource)}
        >
          {SOURCES.map((s) => (
            <ToggleGroupItem key={s.id} value={s.id}>
              <img src={s.logo} alt="" className="size-4" /> {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {error && (
        <Alert variant="destructive" className="m-3">
          <AlertTriangle />
          <AlertTitle>Não foi possível buscar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSearching ? (
        <CenteredSpinner />
      ) : (
        <ScrollArea type="always" className="min-h-0 flex-1">
          <div className="flex flex-col gap-0.5 p-2">
            {!error && results.length === 0 && (
              <EmptyState title="Nenhum resultado." className="p-4" />
            )}
            {results.map((result) => {
              const key = selectionKey(result.source, result.projectId)
              const isSelected = !!selection[key] || pendingKeys.has(key)
              const isInstalled = installedKeys.has(key)
              const isViewing =
                viewing &&
                selectionKey(viewing.source, viewing.projectId) === key
              const actions: ContextMenuAction[] = isInstalled
                ? [
                    {
                      key: 'delete',
                      icon: Trash2,
                      label: 'Remover',
                      variant: 'destructive',
                      onSelect: () => handleDeleteInstalled(result),
                    },
                  ]
                : [
                    {
                      key: 'select-latest',
                      icon: Plus,
                      label: 'Selecionar última versão',
                      onSelect: () => toggleSelection(result),
                    },
                  ]
              return (
                <EntityContextMenu key={key} items={actions}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewing(result)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return
                      e.preventDefault()
                      setViewing(result)
                    }}
                    className={cn(
                      'hover:bg-accent focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg p-2 text-left transition-colors outline-none focus-visible:ring-2',
                      isViewing && 'bg-primary/10',
                      isInstalled && 'opacity-50',
                    )}
                  >
                    <span onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        disabled={isInstalled}
                        onCheckedChange={() => toggleSelection(result)}
                      />
                    </span>
                    <EntityAvatar
                      name={result.name}
                      iconUrl={result.iconUrl}
                      className="size-9"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{result.name}</p>
                        {isInstalled && (
                          <Badge variant="secondary" className="shrink-0">
                            Instalado
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground truncate text-xs">
                        {result.description}
                      </p>
                    </div>
                    <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                      <Download className="size-3" />
                      {result.downloads.toLocaleString()}
                    </span>
                  </div>
                </EntityContextMenu>
              )
            })}
          </div>
        </ScrollArea>
      )}

      <div className="flex items-center justify-between gap-2 border-t p-3">
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as ModSortBy)}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            disabled={selectedCount === 0}
            onClick={() => setView('review')}
          >
            Revisar e Instalar {selectedCount > 0 && `(${selectedCount})`}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            {...tooltipProps(`Enviar ${kindLabel.toLowerCase()} customizado`)}
            disabled={isUploading}
            onClick={handleUploadCustom}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
          </Button>
        </div>
      </div>
    </div>
  )
}
