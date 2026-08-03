import { listen } from '@tauri-apps/api/event'
import { Check, Loader2, PackageCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { ProgressGroup } from '@/components/common/ProgressGroup'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { groupByContentKind } from '@/lib/content-kind'

import {
  AstroPackCategoryList,
  type AstroPackCategoryItem,
} from './AstroPackCategoryList'
import {
  ALL_SELECTED,
  AstroPackAPI,
  type AstroPackEvent,
  type AstroPackManifest,
  type ExportSelection,
} from '../services/astropack.api'

type EntryStatus = 'pending' | 'downloading' | 'done' | 'failed'

interface EntryProgress {
  kind: string
  name: string
  iconUrl: string | null
  status: EntryStatus
}

type Step = 'loading' | 'preview' | 'importing' | 'failed-preview'

interface ImportAstropackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filePath: string
  onImported: () => void
}

const OTHER_KIND_LABELS: Record<string, string> = {
  world: 'Mundos',
  screenshot: 'Screenshots',
}

function groupOtherKinds(entries: EntryProgress[]) {
  return Object.entries(OTHER_KIND_LABELS)
    .map(([kind, label]) => ({
      kind,
      label,
      items: entries.filter((e) => e.kind === kind),
    }))
    .filter((group) => group.items.length > 0)
}

export function ImportAstropackDialog({
  open,
  onOpenChange,
  filePath,
  onImported,
}: ImportAstropackDialogProps) {
  const [step, setStep] = useState<Step>('loading')
  const [manifest, setManifest] = useState<AstroPackManifest | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [selection, setSelection] = useState<ExportSelection>(ALL_SELECTED)

  const [entries, setEntries] = useState<EntryProgress[]>([])
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const [importError, setImportError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  // Reset the wizard during render whenever a new file is picked (the effect
  // below only performs the preview fetch).
  const previewKey = `${open}:${filePath}`
  const [prevPreviewKey, setPrevPreviewKey] = useState(previewKey)
  if (prevPreviewKey !== previewKey) {
    setPrevPreviewKey(previewKey)
    setStep('loading')
    setManifest(null)
    setPreviewError(null)
    setIsDone(false)
  }

  // Reset the progress UI during render whenever an import actually starts, so
  // start() below only subscribes to events and awaits the backend.
  const importPhaseKey = `${previewKey}:${step === 'importing' ? 'importing' : 'idle'}`
  const [prevImportPhaseKey, setPrevImportPhaseKey] = useState(importPhaseKey)
  if (prevImportPhaseKey !== importPhaseKey) {
    setPrevImportPhaseKey(importPhaseKey)
    if (step === 'importing' && manifest) {
      const selectedContents = manifest.contents.filter((entry) => {
        if (entry.kind === 'resourcepack') return selection.resourcepacks
        if (entry.kind === 'shader') return selection.shaders
        return selection.mods
      })
      setEntries(
        selectedContents.map((entry) => ({
          kind: entry.kind,
          name: entry.name,
          iconUrl: entry.iconUrl,
          status: 'pending' as EntryStatus,
        })),
      )
      setCurrent(0)
      setTotal(
        selectedContents.length +
          (selection.worlds ? manifest.worlds.length : 0) +
          (selection.screenshots ? manifest.screenshots.length : 0),
      )
      setImportError(null)
      setIsDone(false)
    }
  }

  useEffect(() => {
    if (!open || !filePath) return
    let cancelled = false

    AstroPackAPI.previewAstropack(filePath)
      .then((result) => {
        if (cancelled) return
        setManifest(result)
        setSelection({
          settings: !!result.settings,
          worlds: result.worlds.length > 0,
          notes: result.notes.length > 0,
          mods: result.contents.some((e) => e.kind === 'mod'),
          resourcepacks: result.contents.some((e) => e.kind === 'resourcepack'),
          shaders: result.contents.some((e) => e.kind === 'shader'),
          servers: result.servers.length > 0,
          screenshots: result.screenshots.length > 0,
        })
        setStep('preview')
      })
      .catch((err) => {
        if (cancelled) return
        setPreviewError(String(err))
        setStep('failed-preview')
      })

    return () => {
      cancelled = true
    }
  }, [open, filePath])

  useEffect(() => {
    if (!open || !filePath || step !== 'importing' || !manifest) return

    let unlisten: (() => void) | undefined
    let cancelled = false

    async function start() {
      unlisten = await listen<AstroPackEvent>('astropack://event', (event) => {
        const payload = event.payload
        if (payload.type === 'progress') {
          setTotal(payload.total)
          setCurrent(payload.current + 1)
          setEntries((prev) => {
            const exists = prev.find((e) => e.name === payload.name)
            if (exists)
              return prev.map((e) =>
                e.name === payload.name
                  ? { ...e, status: 'downloading' as EntryStatus }
                  : e,
              )
            if (payload.kind === 'world' || payload.kind === 'screenshot') {
              return [
                ...prev,
                {
                  kind: payload.kind,
                  name: payload.name,
                  iconUrl: null,
                  status: 'downloading' as EntryStatus,
                },
              ]
            }
            return prev
          })
        } else if (payload.type === 'error') {
          setEntries((prev) =>
            prev.map((e) =>
              e.status === 'downloading'
                ? { ...e, status: 'failed' as EntryStatus }
                : e,
            ),
          )
        }
      })

      try {
        const result = await AstroPackAPI.importAstropack({
          filePath,
          selection,
        })
        if (cancelled) return
        setIsDone(true)
        setEntries((prev) =>
          prev.map((e) => ({ ...e, status: 'done' as EntryStatus })),
        )
        setCurrent((c) => (total > 0 ? total : c))
        toast.success(`Instância "${result.name}" importada com sucesso`)
        onImported()
      } catch (err) {
        if (cancelled) return
        setImportError(String(err))
        toast.error(`Falha ao importar: ${String(err)}`)
      }
    }

    start()

    return () => {
      cancelled = true
      unlisten?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, filePath, manifest])

  const overallPercent = total > 0 ? (current / total) * 100 : 0
  const isImporting = step === 'importing' && !isDone && !importError
  const canClose = step !== 'importing' || isDone || !!importError

  const categoryItems: AstroPackCategoryItem[] = manifest
    ? [
        {
          key: 'settings',
          label: 'Configurações do jogo (options.txt)',
          count: !!manifest.settings,
          checked: selection.settings,
        },
        {
          key: 'worlds',
          label: 'Mundos',
          count: manifest.worlds.length,
          checked: selection.worlds,
        },
        {
          key: 'notes',
          label: 'Notas',
          count: manifest.notes.length,
          checked: selection.notes,
        },
        {
          key: 'mods',
          label: 'Mods',
          count: manifest.contents.filter((e) => e.kind === 'mod').length,
          checked: selection.mods,
        },
        {
          key: 'resourcepacks',
          label: 'Resource Packs',
          count: manifest.contents.filter((e) => e.kind === 'resourcepack')
            .length,
          checked: selection.resourcepacks,
        },
        {
          key: 'shaders',
          label: 'Shader Packs',
          count: manifest.contents.filter((e) => e.kind === 'shader').length,
          checked: selection.shaders,
        },
        {
          key: 'servers',
          label: 'Servidores salvos',
          count: manifest.servers.length,
          checked: selection.servers,
        },
        {
          key: 'screenshots',
          label: 'Screenshots',
          count: manifest.screenshots.length,
          checked: selection.screenshots,
        },
      ]
    : []

  const handleToggle = (key: string, checked: boolean) =>
    setSelection((prev) => ({ ...prev, [key]: checked }))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && canClose) onOpenChange(false)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="size-5" />
            Importar Instância
          </DialogTitle>
        </DialogHeader>

        {step === 'loading' && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Lendo pacote...
          </div>
        )}

        {step === 'failed-preview' && (
          <div className="flex flex-col gap-4">
            <p className="text-destructive text-sm">{previewError}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}

        {step === 'preview' && manifest && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium">{manifest.name}</p>
              <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>Versão: {manifest.version}</span>
                {manifest.loader && (
                  <span>
                    Loader: {manifest.loader}
                    {manifest.loaderVersion ? ` ${manifest.loaderVersion}` : ''}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground text-sm">
              Escolha o que importar.
            </p>
            <AstroPackCategoryList
              items={categoryItems}
              onToggle={handleToggle}
            />

            {manifest.contents.length > 0 && (
              <ScrollArea className="max-h-48">
                <div className="flex flex-col gap-3">
                  {groupByContentKind(manifest.contents).map((group) => (
                    <div key={group.kind} className="flex flex-col gap-1">
                      <p className="text-muted-foreground px-2 text-xs font-medium">
                        {group.label}
                      </p>
                      {group.items.map((entry) => (
                        <div
                          key={`${entry.kind}-${entry.fileName}`}
                          className="hover:bg-accent flex items-center gap-3 rounded-lg p-2"
                        >
                          <EntityAvatar
                            name={entry.name}
                            iconUrl={entry.iconUrl}
                            className="size-7 shrink-0"
                            fallbackClassName="text-[10px]"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{entry.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep('importing')}>
                Deseja importar?
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col gap-4">
            <ProgressGroup
              label="Progresso geral"
              value={overallPercent}
              rightLabel={`${current}/${total}`}
            />

            {entries.length === 0 && isImporting ? (
              <CenteredSpinner className="py-6" iconClassName="size-5" />
            ) : (
              <ScrollArea className="max-h-72">
                <div className="flex flex-col gap-3">
                  {[
                    ...groupByContentKind(entries),
                    ...groupOtherKinds(entries),
                  ].map((group) => (
                    <div key={group.kind} className="flex flex-col gap-1">
                      <p className="text-muted-foreground px-2 text-xs font-medium">
                        {group.label}
                      </p>
                      {group.items.map((entry) => (
                        <div
                          key={entry.name}
                          className="hover:bg-accent flex items-center gap-3 rounded-lg p-2"
                        >
                          <EntityAvatar
                            name={entry.name}
                            iconUrl={entry.iconUrl}
                            className="size-7 shrink-0"
                            fallbackClassName="text-[10px]"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{entry.name}</p>
                          </div>
                          {entry.status === 'pending' && (
                            <div className="size-4 shrink-0" />
                          )}
                          {entry.status === 'downloading' && (
                            <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                          )}
                          {entry.status === 'done' && (
                            <Check className="text-primary size-4 shrink-0" />
                          )}
                          {entry.status === 'failed' && (
                            <X className="text-destructive size-4 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {importError && (
              <p className="text-destructive text-xs">{importError}</p>
            )}

            {canClose && (
              <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
