import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { CONTENT_KIND_LABELS } from '@/lib/content-kind'
import type {
  ContentKind,
  InstalledMod,
  ModSearchResult,
  ModSource,
  ModVersion,
} from '@/types/mods'

import { ModAPI } from '../services/mod.api'

export type SortBy = 'relevance' | 'downloads'
export type SelectionMap = Record<
  string,
  { result: ModSearchResult; version: ModVersion }
>

export function selectionKey(source: ModSource, projectId: string) {
  return `${source}:${projectId}`
}

interface UseModBrowserArgs {
  open: boolean
  onOpenChange: (open: boolean) => void
  instanceId: string
  gameVersion?: string
  loader?: string | null
  kind: ContentKind
  onInstalled: () => void
}

/** Estado e lógica do browser de mods: busca com debounce, seleção com fetch
 * de versão sob demanda e upload de arquivo customizado. */
export function useModBrowser({
  open,
  onOpenChange,
  instanceId,
  gameVersion,
  loader,
  kind,
  onInstalled,
}: UseModBrowserArgs) {
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

  return {
    source,
    setSource,
    query,
    setQuery,
    sortBy,
    setSortBy,
    sortedResults,
    isSearching,
    error,
    viewing,
    setViewing,
    selection,
    view,
    setView,
    isUploading,
    pendingKeys,
    installedKeys,
    installedFileNames,
    selectedCount,
    effectiveLoader,
    kindLabel,
    toggleSelection,
    handleUploadCustom,
  }
}
