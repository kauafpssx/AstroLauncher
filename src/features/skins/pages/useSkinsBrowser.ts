import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import type {
  SkinModel,
  SkinSortBy,
  SkinSource,
  SkinSummary,
} from '@/types/skins'
import { SkinAPI } from '@/features/skins/services/skin.api'
import { useMcstatKeyManager } from './useMcstatKeyManager'
function defaultSortFor(source: SkinSource): SkinSortBy {
  return source === 'mcstat' ? 'popular' : 'popular-desc'
}
function isUnauthorized(err: unknown) {
  return String(err).includes('401')
}
export function skinKey(skin: SkinSummary) {
  return `${skin.source}:${skin.id}`
}
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
  const galleryRequestIdRef = useRef(0)
  const searchRequestIdRef = useRef(0)
  const {
    mcstatApiKey,
    setMcstatApiKey,
    mcstatKeyDialogOpen,
    setMcstatKeyDialogOpen,
    mcstatKeyInvalid,
    markKeyInvalid,
    submitMcstatKey: submitKey,
  } = useMcstatKeyManager()
  useDiscordPresence('Navegando por skins', query.trim() || 'Galeria de skins')
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
  const galleryKey = `${source}:${sortBy}:${modelFilter}`
  const [prevGalleryKey, setPrevGalleryKey] = useState(galleryKey)
  if (prevGalleryKey !== galleryKey) {
    setPrevGalleryKey(galleryKey)
    setIsLoading(true)
    setPopularSkins([])
    setMatchedSkins([])
  }
  const submitMcstatKey = async (key: string) => {
    await submitKey(key)
    const mcstatSortBy = defaultSortFor('mcstat')
    setSource('mcstat')
    setSortBy(mcstatSortBy)
    setModel('all')
    setPrevGalleryKey(`mcstat:${mcstatSortBy}:null`)
    setPopularSkins([])
    setPage(1)
    setHasMore(true)
    setIsLoading(false)
  }
  const handleSkinsError = useCallback(
    (err: unknown, fallbackMessage: string) => {
      if (source === 'mcstat' && isUnauthorized(err)) {
        markKeyInvalid()
        return
      }
      toast.error(`${fallbackMessage}: ${String(err)}`)
    },
    [source, markKeyInvalid],
  )
  useEffect(() => {
    const requestId = ++galleryRequestIdRef.current
    SkinAPI.search({ source, query: '', page: 1, sortBy, model: modelFilter })
      .then((data) => {
        if (galleryRequestIdRef.current !== requestId) return
        setPopularSkins(data)
        setPage(1)
        setHasMore(data.length > 0)
      })
      .catch((err) => {
        if (galleryRequestIdRef.current !== requestId) return
        handleSkinsError(err, 'Falha ao buscar skins')
      })
      .finally(() => {
        if (galleryRequestIdRef.current === requestId) setIsLoading(false)
      })
  }, [source, sortBy, modelFilter, handleSkinsError])
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
            handleSkinsError(err, 'Falha ao buscar skins'),
        )
    }, 200)
    return () => clearTimeout(handle)
  }, [source, query, sortBy, modelFilter, handleSkinsError])
  const loadMore = async () => {
    setIsLoadingMore(true)
    const requestId = galleryRequestIdRef.current
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
      if (galleryRequestIdRef.current === requestId) {
        handleSkinsError(err, 'Falha ao buscar mais skins')
      }
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
    mcstatKeyInvalid,
    submitMcstatKey,
    handleSourceChange,
    loadMore,
    isSearching,
    matchedKeys,
    combined,
  }
}
