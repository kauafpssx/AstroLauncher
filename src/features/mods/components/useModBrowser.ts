import { useEffect, useMemo, useRef, useState } from 'react'

import { CONTENT_KIND_LABELS } from '@/lib/content-kind'
import type {
  ContentKind,
  InstalledMod,
  ModSearchResult,
  ModSortBy,
  ModSource,
} from '@/types/mods'
import { MOD_SEARCH_PAGE_SIZE } from '@/types/mods'

import { ModAPI } from '../services/mod.api'
import {
  createDeleteInstalled,
  createToggleSelection,
  createUploadCustom,
} from './mod-browser-actions'
import {
  normalizeName,
  selectionKey,
  type SelectionMap,
} from './selection-utils'

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

/** State and logic for the mod browser: debounced search, selection with
 * on-demand version fetch, and custom file upload. */
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
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
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
      setHasMore(false)
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

  // Mods already installed in this instance, matched three ways since
  // CurseForge and Modrinth use different project IDs for what can be the
  // same mod: exact source+projectId (reinstalling the same mod), name
  // (spotting the equivalent mod on the other platform in the browse list),
  // and jar filename (blocking an actual duplicate download at install time).
  const installedKeys = useMemo(
    () =>
      new Set(
        installedMods.map((m) => selectionKey(m.source as ModSource, m.modId)),
      ),
    [installedMods],
  )
  const installedNames = useMemo(
    () => new Set(installedMods.map((m) => normalizeName(m.name))),
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
          setHasMore(data.length >= MOD_SEARCH_PAGE_SIZE)
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

  const loadMore = () => {
    if (isSearching || isLoadingMore || !hasMore) return
    const requestId = ++requestIdRef.current
    setIsLoadingMore(true)
    ModAPI.search({
      source,
      query,
      projectType: kind,
      gameVersion: gameVersion ?? null,
      loader: effectiveLoader,
      sort: sortBy,
      offset: results.length,
    })
      .then((data) => {
        if (requestIdRef.current !== requestId) return
        setResults((prev) => [...prev, ...data])
        setHasMore(data.length >= MOD_SEARCH_PAGE_SIZE)
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return
        setError(String(err))
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return
        setIsLoadingMore(false)
      })
  }

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
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    viewing,
    setViewing,
    selection,
    view,
    setView,
    isUploading,
    pendingKeys,
    installedKeys,
    installedNames,
    installedFileNames,
    selectedCount,
    effectiveLoader,
    kindLabel,
    toggleSelection,
    handleUploadCustom,
    handleDeleteInstalled,
  }
}
