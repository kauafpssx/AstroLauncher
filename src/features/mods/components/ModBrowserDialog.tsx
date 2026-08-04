import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { AlertTriangle, Loader2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { SearchInput } from '@/components/common/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CONTENT_KIND_LABELS } from '@/lib/content-kind'
import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'
import type {
  ContentKind,
  InstalledMod,
  ModSearchResult,
  ModSource,
  ModVersion,
} from '@/types/mods'

import { ModAPI } from '../services/mod.api'
import { ModDetailPanel } from './ModDetailPanel'
import { ModReviewPanel } from './ModReviewPanel'

type SortBy = 'relevance' | 'downloads'
type SelectionMap = Record<
  string,
  { result: ModSearchResult; version: ModVersion }
>

const SOURCES: { id: ModSource; label: string; logo: string }[] = [
  { id: 'modrinth', label: 'Modrinth', logo: '/providers/modrinth.svg' },
  { id: 'curseforge', label: 'CurseForge', logo: '/providers/curseforge.png' },
]

function selectionKey(source: ModSource, projectId: string) {
  return `${source}:${projectId}`
}

interface ModBrowserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instanceId: string
  gameVersion?: string
  loader?: string | null
  kind?: ContentKind
  onInstalled: () => void
}

export function ModBrowserDialog({
  open,
  onOpenChange,
  instanceId,
  gameVersion,
  loader,
  kind = 'mod',
  onInstalled,
}: ModBrowserDialogProps) {
  const [source, setSource] = useState<ModSource>('modrinth')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('relevance')
  const [results, setResults] = useState<ModSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<ModSearchResult | null>(null)
  const [selection, setSelection] = useState<SelectionMap>({})
  const [view, setView] = useState<'browse' | 'review'>('browse')
  const [isUploading, setIsUploading] = useState(false)
  const [installedMods, setInstalledMods] = useState<InstalledMod[]>([])
  // Keys with an in-flight version fetch — checkbox reflects these instantly
  // instead of waiting for the network round-trip.
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())

  // Only mods are loader-specific; resource packs/shaders shouldn't be
  // filtered by fabric/forge/etc.
  const effectiveLoader = kind === 'mod' ? loader : null
  const { plural: kindLabel, fileFilter } = CONTENT_KIND_LABELS[kind]

  const requestIdRef = useRef(0)

  // Reset the whole browsing state when the dialog closes — done during render
  // ("adjust state when a prop changes") instead of in an effect.
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (!open) {
      setQuery('')
      setResults([])
      setViewing(null)
      setSelection({})
      setPendingKeys(new Set())
      setError(null)
      setView('browse')
    }
  }

  useEffect(() => {
    if (!open) return
    ModAPI.listInstalled(instanceId, kind)
      .then(setInstalledMods)
      .catch(() => setInstalledMods([]))
  }, [open, instanceId, kind])

  // Mods already installed in this instance — matched both by exact
  // source+projectId (reinstalling the same mod) and by jar filename
  // (the same mod pulled from the other platform), since CurseForge and
  // Modrinth use different project IDs for what is otherwise the same file.
  const installedKeys = useMemo(
    () =>
      new Set(
        installedMods.map((m) => selectionKey(m.source as ModSource, m.modId)),
      ),
    [installedMods],
  )
  const installedFileNames = useMemo(
    () => new Set(installedMods.map((m) => m.fileName.toLowerCase())),
    [installedMods],
  )

  useEffect(() => {
    if (!open) return
    const requestId = ++requestIdRef.current

    const handle = setTimeout(() => {
      setError(null)
      setIsSearching(true)
      ModAPI.search({
        source,
        query,
        projectType: kind,
        gameVersion: gameVersion ?? null,
        loader: effectiveLoader,
      })
        .then((data) => {
          if (requestIdRef.current !== requestId) return
          setResults(data)
        })
        .catch((err) => {
          if (requestIdRef.current !== requestId) return
          setError(String(err))
        })
        .finally(() => {
          if (requestIdRef.current !== requestId) return
          setIsSearching(false)
        })
    }, 200)

    return () => clearTimeout(handle)
  }, [open, source, query, kind, gameVersion, effectiveLoader])

  const sortedResults = [...results].sort((a, b) =>
    sortBy === 'downloads' ? b.downloads - a.downloads : 0,
  )

  const toggleSelection = async (
    result: ModSearchResult,
    version?: ModVersion,
  ) => {
    const key = selectionKey(result.source, result.projectId)
    if (selection[key]) {
      setSelection((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return
    }

    if (pendingKeys.has(key)) {
      // Second click while the version fetch is still in flight: cancel it,
      // the checkbox flips back off instantly.
      setPendingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      return
    }

    if (installedKeys.has(key)) return

    if (version) {
      if (installedFileNames.has(version.fileName.toLowerCase())) {
        toast.error('Este mod já está instalado (mesmo arquivo).')
        return
      }
      setSelection((prev) => ({ ...prev, [key]: { result, version } }))
      return
    }

    setPendingKeys((prev) => new Set(prev).add(key))
    try {
      const versions = await ModAPI.getVersions({
        source: result.source,
        projectId: result.projectId,
        gameVersion,
        loader: effectiveLoader,
      })

      let wasCancelled = false
      setPendingKeys((prev) => {
        if (!prev.has(key)) {
          wasCancelled = true
          return prev
        }
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      if (wasCancelled || !versions[0]) return

      if (installedFileNames.has(versions[0].fileName.toLowerCase())) {
        toast.error('Este mod já está instalado (mesmo arquivo).')
        return
      }
      setSelection((prev) => ({
        ...prev,
        [key]: { result, version: versions[0] },
      }))
    } catch (err) {
      setPendingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
      setError(String(err))
    }
  }

  const selectedCount = Object.keys(selection).length

  const handleUploadCustom = async () => {
    const filePath = await openFileDialog({
      multiple: false,
      filters: [{ name: kindLabel, extensions: [fileFilter] }],
    })
    if (!filePath || Array.isArray(filePath)) return

    setIsUploading(true)
    try {
      await ModAPI.installCustom({ instanceId, filePath, kind })
      toast.success('Adicionado com sucesso')
      onInstalled()
      onOpenChange(false)
    } catch (err) {
      toast.error(`Falha ao adicionar: ${String(err)}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[85vh] max-h-[720px] flex-col gap-0 p-0 sm:max-w-5xl"
      >
        <DialogTitle className="sr-only">Buscar {kindLabel}</DialogTitle>

        {view === 'review' ? (
          <ModReviewPanel
            instanceId={instanceId}
            selection={selection}
            gameVersion={gameVersion}
            loader={effectiveLoader}
            kind={kind}
            installedKeys={installedKeys}
            installedFileNames={installedFileNames}
            onBack={() => setView('browse')}
            onInstalled={() => {
              onInstalled()
              onOpenChange(false)
            }}
          />
        ) : (
          <div className="flex min-h-0 flex-1">
            <div className="flex min-w-0 flex-1 flex-col border-r">
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
                <Button
                  variant="outline"
                  size="icon"
                  {...tooltipProps(
                    `Enviar ${kindLabel.toLowerCase()} customizado`,
                  )}
                  disabled={isUploading}
                  onClick={handleUploadCustom}
                >
                  {isUploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Upload />
                  )}
                </Button>
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
                    {!error && sortedResults.length === 0 && (
                      <EmptyState title="Nenhum resultado." className="p-4" />
                    )}
                    {sortedResults.map((result) => {
                      const key = selectionKey(result.source, result.projectId)
                      const isSelected =
                        !!selection[key] || pendingKeys.has(key)
                      const isInstalled = installedKeys.has(key)
                      const isViewing =
                        viewing &&
                        selectionKey(viewing.source, viewing.projectId) === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setViewing(result)}
                          className={cn(
                            'hover:bg-accent flex items-center gap-3 rounded-lg p-2 text-left transition-colors',
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
                              <p className="truncate font-medium">
                                {result.name}
                              </p>
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
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}

              <div className="flex items-center justify-between gap-2 border-t p-3">
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortBy)}
                >
                  <SelectTrigger size="sm" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="downloads">Downloads</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={selectedCount === 0}
                  onClick={() => setView('review')}
                >
                  Revisar e Instalar {selectedCount > 0 && `(${selectedCount})`}
                </Button>
              </div>
            </div>

            <div className="w-96 shrink-0">
              {viewing ? (
                <ModDetailPanel
                  result={viewing}
                  gameVersion={gameVersion}
                  loader={effectiveLoader}
                  isSelected={
                    !!selection[
                      selectionKey(viewing.source, viewing.projectId)
                    ] ||
                    pendingKeys.has(
                      selectionKey(viewing.source, viewing.projectId),
                    )
                  }
                  isInstalled={installedKeys.has(
                    selectionKey(viewing.source, viewing.projectId),
                  )}
                  installedFileNames={installedFileNames}
                  onToggleSelect={(version) =>
                    toggleSelection(viewing, version)
                  }
                />
              ) : (
                <EmptyState
                  title="Selecione um item na lista para ver detalhes."
                  className="h-full p-6"
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
