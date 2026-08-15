import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  buildImportCategoryItems,
  computeImportEntries,
  type EntryProgress,
  type EntryStatus,
  type Step,
} from './astropack-import-helpers'
import {
  ALL_SELECTED,
  AstroPackAPI,
  type AstroPackEvent,
  type AstroPackManifest,
  type ExportSelection,
} from '../services/astropack.api'

export type { EntryProgress, Step }

interface UseAstropackImportArgs {
  open: boolean
  filePath: string
  onImported: () => void
}

/** Import flow for a `.astropack`: manifest preview, selection of what to
 * import, and import with progress via Tauri events. */
export function useAstropackImport({
  open,
  filePath,
  onImported,
}: UseAstropackImportArgs) {
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
      const { entries: initialEntries, total: initialTotal } =
        computeImportEntries(manifest, selection)
      setEntries(initialEntries)
      setCurrent(0)
      setTotal(initialTotal)
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
        await AstroPackAPI.importAstropack({
          filePath,
          selection,
        })
        if (cancelled) return
        setIsDone(true)
        setEntries((prev) =>
          prev.map((e) => ({ ...e, status: 'done' as EntryStatus })),
        )
        setCurrent((c) => (total > 0 ? total : c))
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
  const categoryItems = buildImportCategoryItems(manifest, selection)
  const handleToggle = (key: string, checked: boolean) =>
    setSelection((prev) => ({ ...prev, [key]: checked }))

  return {
    step,
    setStep,
    manifest,
    previewError,
    entries,
    current,
    total,
    importError,
    isImporting,
    overallPercent,
    canClose,
    categoryItems,
    handleToggle,
  }
}
