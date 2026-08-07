import { useEffect, useMemo, useRef, useState } from 'react'

import { CONTENT_KIND_LABELS } from '@/lib/content-kind'
import type {
  ContentKind,
  InstalledMod,
  ModSearchResult,
  ModSortBy,
  ModSource,
} from '@/types/mods'

import { ModAPI } from '../services/mod.api'
import {
  createDeleteInstalled,
  createToggleSelection,
  createUploadCustom,
} from './mod-browser-actions'
import { selectionKey, type SelectionMap } from './selection-utils'

export { selectionKey } from './selection-utils'
export type { SelectionMap } from './selection-utils'

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
  const [sortBy, setSortBy] = useState<ModSortBy>('relevance')
  const [results, setResults] = useState<ModSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<ModSearchResult | null>(null)
  const [selection, setSelection] = useState<SelectionMap>({})
  const [view, setView] = useState<'browse' | 'review'>('browse')
  const [isUploading, setIsUploading] = useState(false)
  const [installedMods, setInstalledMods] = useState<InstalledMod[]>([])
  // Keys with an in-flight version fetch: checkbox reflects these instantly
  // instead of waiting for the network round-trip.
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set())

  // Only mods are loader-specific; resource packs/shaders shouldn't be
  // filtered by fabric/forge/etc.
  const effectiveLoader = kind === 'mod' ? loader : null
  const { plural: kindLabel, fileFilter } = CONTENT_KIND_LABELS[kind]

  const requestIdRef = useRef(0)

  // Reset the whole browsing state when the dialog closes: done during render
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

  // Mods already installed in this instance: matched both by exact
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
        sort: sortBy,
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
  }, [open, source, query, kind, gameVersion, effectiveLoader, sortBy])

  const toggleSelection = createToggleSelection({
    selection,
    setSelection,
    pendingKeys,
    setPendingKeys,
    installedKeys,
    installedFileNames,
    gameVersion,
    effectiveLoader,
    setError,
  })

  const selectedCount = Object.keys(selection).length

  const handleDeleteInstalled = createDeleteInstalled({
    instanceId,
    installedMods,
    setInstalledMods,
    onInstalled,
  })

  const handleUploadCustom = createUploadCustom({
    instanceId,
    kind,
    kindLabel,
    fileFilter,
    setIsUploading,
    onOpenChange,
    onInstalled,
  })

  return {
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
    handleDeleteInstalled,
  }
}
