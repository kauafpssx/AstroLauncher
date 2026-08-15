import { AlertTriangle, Loader2, Upload } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { tooltipProps } from '@/lib/tooltip'
import type { ModSortBy, ModSource } from '@/types/mods'

import { SORT_OPTIONS, SOURCES } from './mod-browser-list.constants'
import { ModBrowserListItem } from './ModBrowserListItem'
import { normalizeName } from './selection-utils'
import type { useModBrowser } from './useModBrowser'
import { selectionKey } from './useModBrowser'

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
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    viewing,
    setViewing,
    selection,
    setView,
    isUploading,
    pendingKeys,
    installedKeys,
    installedNames,
    selectedCount,
    kindLabel,
    toggleSelection,
    handleUploadCustom,
    handleDeleteInstalled,
  } = browser

  const { viewportRef, sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  })

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
        <ScrollArea
          type="always"
          className="min-h-0 flex-1"
          viewportRef={viewportRef}
        >
          <div className="flex flex-col gap-0.5 p-2">
            {!error && results.length === 0 && (
              <EmptyState title="Nenhum resultado." className="p-4" />
            )}
            {results.map((result) => {
              const key = selectionKey(result.source, result.projectId)
              const isSelected = !!selection[key] || pendingKeys.has(key)
              const isInstalled =
                installedKeys.has(key) ||
                installedNames.has(normalizeName(result.name))
              const isViewing =
                !!viewing &&
                selectionKey(viewing.source, viewing.projectId) === key
              return (
                <ModBrowserListItem
                  key={key}
                  result={result}
                  isSelected={isSelected}
                  isInstalled={isInstalled}
                  isViewing={isViewing}
                  onView={setViewing}
                  onToggleSelection={toggleSelection}
                  onDeleteInstalled={handleDeleteInstalled}
                />
              )
            })}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center p-3">
                {isLoadingMore && (
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                )}
              </div>
            )}
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
