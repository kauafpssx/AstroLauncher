import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import type {
  SkinModel,
  SkinSortBy,
  SkinSource,
  SkinSummary,
} from '@/types/skins'

import { SkinAPI } from '../services/skin.api'

function defaultSortFor(source: SkinSource): SkinSortBy {
  return source === 'mcstat' ? 'popular' : 'popular-desc'
}

export function skinKey(skin: SkinSummary) {
  return `${skin.source}:${skin.id}`
}

/** Estado e dados da galeria de skins: galeria "popular" paginada + busca
 * sobreposta com debounce, troca de fonte (PlayerMC/MCStat) e API key. */
export function useSkinsBrowser() {
  const [source, setSource] = useState<SkinSource>('playermc')
  const [sortBy, setSortBy] = useState<SkinSortBy>('popular-desc')
  const [model, setModel] = useState<'all' | SkinModel>('all')
  const [query, setQuery] = useState('')
  const [popularSkins, setPopularSkins] = useState<SkinSummary[]>([])
  const [matchedSkins, setMatchedSkins] = useState<SkinSummary[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selected, setSelected] = useState<SkinSummary | null>(null)
  const [mcstatApiKey, setMcstatApiKey] = useState('')
  const [mcstatKeyDialogOpen, setMcstatKeyDialogOpen] = useState(false)
  // Separate counters — the gallery-load and the debounced-search effects
  // are independent requests. Sharing one ref meant the search effect's
  // early-return (empty query) still bumped the counter, invalidating an
  // in-flight gallery fetch before its `.then()` ever ran, which left
  // `isLoading` stuck `true` forever.
  const galleryRequestIdRef = useRef(0)
  const searchRequestIdRef = useRef(0)

  useDiscordPresence('Navegando por skins', query.trim() || 'Galeria de skins')

  useEffect(() => {
    SettingsAPI.get()
      .then((settings) => setMcstatApiKey(settings.mcstatApiKey ?? ''))
      .catch(() => {})
  }, [])

  // MCStat requires the user's own API key — it isn't bundled with the
  // launcher. Picking that tab without one saved opens the key dialog
  // instead of switching, and only switches once a key is confirmed.
  const handleSourceChange = (next: SkinSource) => {
    if (next === 'mcstat' && !mcstatApiKey) {
      setMcstatKeyDialogOpen(true)
      return
    }
    setSource(next)
    setSortBy(defaultSortFor(next))
    setModel('all')
  }

  const modelFilter = source === 'mcstat' && model !== 'all' ? model : null

  // Popular gallery loads once per source/sort/model and stays mounted —
  // searching never reloads or unmounts these cards, it only overlays which
  // ones match on top of them. Changing any filter resets everything and
  // reloads. The reset happens during render (like the query reset below) so
  // the effect below only has to fetch.
  const galleryKey = `${source}:${sortBy}:${modelFilter}`
  const [prevGalleryKey, setPrevGalleryKey] = useState(galleryKey)
  if (prevGalleryKey !== galleryKey) {
    setPrevGalleryKey(galleryKey)
    setIsLoading(true)
    setPopularSkins([])
    setMatchedSkins([])
  }

  useEffect(() => {
    const requestId = ++galleryRequestIdRef.current
    SkinAPI.search({ source, query: '', page: 1, sortBy, model: modelFilter })
      .then((data) => {
        if (galleryRequestIdRef.current !== requestId) return
        setPopularSkins(data)
        setPage(1)
        setHasMore(data.length > 0)
      })
      .catch((err) => toast.error(`Falha ao buscar skins: ${String(err)}`))
      .finally(() => {
        if (galleryRequestIdRef.current === requestId) setIsLoading(false)
      })
  }, [source, sortBy, modelFilter])

  // Clear search results during render when the query is emptied (the effect
  // below only performs the debounced fetch).
  const [prevQuery, setPrevQuery] = useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    if (!query.trim()) setMatchedSkins([])
  }

  useEffect(() => {
    if (!query.trim()) return
    const requestId = ++searchRequestIdRef.current
    const handle = setTimeout(() => {
      SkinAPI.search({ source, query, page: 1, sortBy, model: modelFilter })
        .then(
          (data) =>
            searchRequestIdRef.current === requestId && setMatchedSkins(data),
        )
        .catch(
          (err) =>
            searchRequestIdRef.current === requestId &&
            toast.error(`Falha ao buscar skins: ${String(err)}`),
        )
    }, 200)
    return () => clearTimeout(handle)
  }, [source, query, sortBy, modelFilter])

  const loadMore = async () => {
    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const data = await SkinAPI.search({
        source,
        query: '',
        page: nextPage,
        sortBy,
        model: modelFilter,
      })
      setPopularSkins((prev) => [...prev, ...data])
      setPage(nextPage)
      setHasMore(data.length > 0)
    } catch (err) {
      toast.error(`Falha ao buscar mais skins: ${String(err)}`)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const isSearching = query.trim().length > 0
  const matchedKeys = new Set(matchedSkins.map(skinKey))
  const combined = isSearching
    ? [
        ...matchedSkins,
        ...popularSkins.filter((s) => !matchedKeys.has(skinKey(s))),
      ]
    : popularSkins

  return {
    source,
    setSource,
    sortBy,
    setSortBy,
    model,
    setModel,
    query,
    setQuery,
    hasMore,
    isLoading,
    isLoadingMore,
    selected,
    setSelected,
    mcstatApiKey,
    setMcstatApiKey,
    mcstatKeyDialogOpen,
    setMcstatKeyDialogOpen,
    handleSourceChange,
    loadMore,
    isSearching,
    matchedKeys,
    combined,
  }
}
