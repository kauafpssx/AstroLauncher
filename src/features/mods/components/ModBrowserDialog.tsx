import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { AlertTriangle, Loader2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { SearchInput } from '@/components/common/SearchInput'
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
import { cn } from '@/lib/utils'
import type { ContentKind, ModSearchResult, ModSource, ModVersion } from '@/types/mods'

import { ModAPI } from '../services/mod.api'
import { ModDetailPanel } from './ModDetailPanel'
import { ModReviewPanel } from './ModReviewPanel'

type SortBy = 'relevance' | 'downloads'
type SelectionMap = Record<string, { result: ModSearchResult; version: ModVersion }>

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
      setError(null)
      setView('browse')
    }
  }

  useEffect(() => {
    if (!open) return
    const requestId = ++requestIdRef.current

    const handle = setTimeout(() => {
      setError(null)
      setIsSearching(true)
      ModAPI.search({ source, query, projectType: kind, gameVersion: gameVersion ?? null, loader: effectiveLoader })
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

  const sortedResults = [...results].sort((a, b) => (sortBy === 'downloads' ? b.downloads - a.downloads : 0))

  const toggleSelection = async (result: ModSearchResult, version?: ModVersion) => {
    const key = selectionKey(result.source, result.projectId)
    if (selection[key]) {
      setSelection((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return
    }

    if (version) {
      setSelection((prev) => ({ ...prev, [key]: { result, version } }))
      return
    }

    try {
      const versions = await ModAPI.getVersions({ source: result.source, projectId: result.projectId, gameVersion, loader: effectiveLoader })
      if (!versions[0]) return
      setSelection((prev) => ({ ...prev, [key]: { result, version: versions[0] } }))
    } catch (err) {
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
      <DialogContent showCloseButton className="flex h-[85vh] max-h-[720px] flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogTitle className="sr-only">Buscar {kindLabel}</DialogTitle>

        {view === 'review' ? (
          <ModReviewPanel
            instanceId={instanceId}
            selection={selection}
            gameVersion={gameVersion}
            loader={effectiveLoader}
            kind={kind}
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
                <ToggleGroup type="single" value={source} onValueChange={(v) => v && setSource(v as ModSource)}>
                  {SOURCES.map((s) => (
                    <ToggleGroupItem key={s.id} value={s.id}>
                      <img src={s.logo} alt="" className="size-4" /> {s.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Button variant="outline" size="icon" title={`Enviar ${kindLabel.toLowerCase()} customizado`} disabled={isUploading} onClick={handleUploadCustom}>
                  {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
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
                      <p className="p-4 text-center text-sm text-muted-foreground">Nenhum resultado.</p>
                    )}
                    {sortedResults.map((result) => {
                      const key = selectionKey(result.source, result.projectId)
                      const isSelected = !!selection[key]
                      const isViewing = viewing && selectionKey(viewing.source, viewing.projectId) === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setViewing(result)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-accent',
                            isViewing && 'bg-primary/10',
                          )}
                        >
                          <span onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(result)} />
                          </span>
                          <EntityAvatar name={result.name} iconUrl={result.iconUrl} className="size-9" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{result.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{result.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}

              <div className="flex items-center justify-between gap-2 border-t p-3">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger size="sm" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="downloads">Downloads</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={selectedCount === 0} onClick={() => setView('review')}>
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
                  isSelected={!!selection[selectionKey(viewing.source, viewing.projectId)]}
                  onToggleSelect={(version) => toggleSelection(viewing, version)}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  Selecione um item na lista para ver detalhes.
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
