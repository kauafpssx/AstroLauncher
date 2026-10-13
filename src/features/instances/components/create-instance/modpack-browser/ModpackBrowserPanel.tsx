import { Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { SearchInput } from '@/components/common/SearchInput'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ModAPI } from '@/features/mods/services/mod.api'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { cn } from '@/lib/utils'
import { useModpackInstallStore } from '@/stores/modpack-install.store'
import {
  MOD_SEARCH_PAGE_SIZE,
  type ModSearchResult,
  type ModSortBy,
  type ModSource,
} from '@/types/mods'
import { ModpackDetailPanel } from './ModpackDetailPanel'
import { ModpackResultItem } from './ModpackResultItem'
import {
  SORT_OPTIONS,
  SOURCE_LABEL,
  SOURCE_LOGO,
} from './modpack-browser-constants'
interface ModpackBrowserPanelProps {
  source: ModSource
}
export function ModpackBrowserPanel({ source }: ModpackBrowserPanelProps) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<ModSortBy>('relevance')
  const [results, setResults] = useState<ModSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [selected, setSelected] = useState<ModSearchResult | null>(null)
  const isInstalling = useModpackInstallStore((s) => s.isInstalling)
  const requestIdRef = useRef(0)
  const [prevSource, setPrevSource] = useState(source)
  if (prevSource !== source) {
    setPrevSource(source)
    setSelected(null)
    setResults([])
    setHasMore(false)
  }
  useEffect(() => {
    const requestId = ++requestIdRef.current
    const handle = setTimeout(() => {
      setIsSearching(true)
      ModAPI.search({ source, query, projectType: 'modpack', sort: sortBy })
        .then((data) => {
          if (requestIdRef.current !== requestId) return
          setResults(data)
          setHasMore(data.length >= MOD_SEARCH_PAGE_SIZE)
        })
        .catch(
          (err) =>
            requestIdRef.current === requestId &&
            toast.error(`Falha ao buscar: ${String(err)}`),
        )
        .finally(
          () => requestIdRef.current === requestId && setIsSearching(false),
        )
    }, 200)
    return () => clearTimeout(handle)
  }, [query, source, sortBy])
  const loadMore = () => {
    if (isSearching || isLoadingMore || !hasMore) return
    const requestId = ++requestIdRef.current
    setIsLoadingMore(true)
    ModAPI.search({
      source,
      query,
      projectType: 'modpack',
      sort: sortBy,
      offset: results.length,
    })
      .then((data) => {
        if (requestIdRef.current !== requestId) return
        setResults((prev) => [...prev, ...data])
        setHasMore(data.length >= MOD_SEARCH_PAGE_SIZE)
      })
      .catch(
        (err) =>
          requestIdRef.current === requestId &&
          toast.error(`Falha ao buscar: ${String(err)}`),
      )
      .finally(
        () => requestIdRef.current === requestId && setIsLoadingMore(false),
      )
  }
  const { viewportRef, sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  })
  return (
    <div className="flex h-full min-w-0 flex-row overflow-hidden rounded-lg border">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel minSize="400px">
          <div className="flex h-full min-w-0 flex-col border-r">
            <div className="p-3">
              <p className="mb-2 flex items-center gap-1.5 font-medium">
                <img src={SOURCE_LOGO[source]} alt="" className="size-4" />
                Modpacks do {SOURCE_LABEL[source]}
              </p>
              <div className="flex items-center gap-2">
                <SearchInput
                  containerClassName="flex-1"
                  placeholder="Pesquisar modpacks..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as ModSortBy)}
                >
                  <SelectTrigger className="w-40">
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
              </div>
            </div>
            {isSearching && results.length === 0 ? (
              <CenteredSpinner />
            ) : (
              <ScrollArea
                type="always"
                className={cn(
                  'min-h-0 min-w-0 flex-1',
                  isSearching &&
                    'pointer-events-none opacity-40 transition-opacity',
                )}
                viewportRef={viewportRef}
              >
                <div className="flex min-w-0 flex-col gap-1 p-2 pr-3">
                  {results.length === 0 && (
                    <p className="text-muted-foreground p-4 text-center text-sm">
                      Nenhum modpack encontrado.
                    </p>
                  )}
                  {results.map((result) => (
                    <ModpackResultItem
                      key={result.projectId}
                      result={result}
                      isSelected={selected?.projectId === result.projectId}
                      isInstalling={isInstalling}
                      onSelect={() => setSelected(result)}
                    />
                  ))}
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
          </div>
        </ResizablePanel>

        {selected && (
          <>
            <ResizableHandle className="animate-in fade-in duration-600" />

            <ResizablePanel defaultSize="448px" minSize="320px" maxSize="50%">
              <div className="animate-in slide-in-from-right-8 fade-in size-full duration-600">
                <ModpackDetailPanel result={selected} source={source} />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
