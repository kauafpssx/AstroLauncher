import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { SearchInput } from '@/components/common/SearchInput'
import { Badge } from '@/components/ui/badge'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModAPI } from '@/features/mods/services/mod.api'
import { cn } from '@/lib/utils'
import { useModpackInstallStore } from '@/stores/modpack-install.store'
import type { ModSearchResult, ModSource } from '@/types/mods'

import { ModpackDetailPanel } from './ModpackDetailPanel'

const SOURCE_LABEL: Record<ModSource, string> = {
  modrinth: 'Modrinth',
  curseforge: 'CurseForge',
}

const LOADER_ICON: Record<string, string> = {
  fabric: '/providers/fabricmc.svg',
  quilt: '/providers/quiltmc.svg',
  forge: '/providers/forge.png',
  neoforge: '/providers/neoforged.svg',
}

const LOADER_LABEL: Record<string, string> = {
  fabric: 'Fabric',
  quilt: 'Quilt',
  forge: 'Forge',
  neoforge: 'NeoForge',
}

interface ModpackBrowserPanelProps {
  source: ModSource
}

export function ModpackBrowserPanel({ source }: ModpackBrowserPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ModSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<ModSearchResult | null>(null)
  const isInstalling = useModpackInstallStore((s) => s.isInstalling)
  const requestIdRef = useRef(0)

  // Clear the list during render when the provider changes (the effect below
  // only performs the debounced fetch).
  const [prevSource, setPrevSource] = useState(source)
  if (prevSource !== source) {
    setPrevSource(source)
    setSelected(null)
    setResults([])
  }

  useEffect(() => {
    const requestId = ++requestIdRef.current
    const handle = setTimeout(() => {
      setIsSearching(true)
      ModAPI.search({ source, query, projectType: 'modpack' })
        .then((data) => requestIdRef.current === requestId && setResults(data))
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
  }, [query, source])

  return (
    <div className="flex h-full min-w-0 flex-row overflow-hidden rounded-lg border">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel minSize="400px">
          <div className="flex h-full min-w-0 flex-col border-r">
            <div className="p-3">
              <p className="mb-2 font-medium">
                Modpacks do {SOURCE_LABEL[source]}
              </p>
              <SearchInput
                placeholder="Pesquisar modpacks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {isSearching ? (
              <CenteredSpinner />
            ) : (
              <ScrollArea type="always" className="min-h-0 min-w-0 flex-1">
                <div className="flex min-w-0 flex-col gap-1 p-2 pr-3">
                  {results.length === 0 && (
                    <p className="text-muted-foreground p-4 text-center text-sm">
                      Nenhum modpack encontrado.
                    </p>
                  )}
                  {results.map((result) => (
                    <button
                      key={result.projectId}
                      type="button"
                      disabled={isInstalling}
                      onClick={() => setSelected(result)}
                      className={cn(
                        'hover:bg-accent flex w-full min-w-0 items-center gap-3 rounded-lg p-2 text-left transition-colors',
                        selected?.projectId === result.projectId &&
                          'bg-primary/10',
                        isInstalling &&
                          'cursor-not-allowed opacity-50 hover:bg-transparent',
                      )}
                    >
                      <EntityAvatar
                        name={result.name}
                        iconUrl={result.iconUrl}
                        className="size-10"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-medium">{result.name}</p>
                          {result.loader && (
                            <Badge variant="outline" className="shrink-0">
                              {LOADER_ICON[result.loader] && (
                                <img
                                  src={LOADER_ICON[result.loader]}
                                  alt=""
                                  className="size-3"
                                />
                              )}
                              {LOADER_LABEL[result.loader] ?? result.loader}
                            </Badge>
                          )}
                          {result.gameVersion && (
                            <Badge variant="secondary" className="shrink-0">
                              {result.gameVersion}
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
                    </button>
                  ))}
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
