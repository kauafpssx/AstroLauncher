import { useCallback, useEffect, useRef, useState } from 'react'
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

// The command surfaces reqwest's own error text (e.g. "HTTP status client
// error (401 Unauthorized) for url (...)"), not a structured status code —
// matching the substring is the only signal we have from the backend.
function isUnauthorized(err: unknown) {
  return String(err).includes('401')
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
  const [mcstatKeyInvalid, setMcstatKeyInvalid] = useState(false)
  // Separate counters: the gallery-load and the debounced-search effects
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

  // MCStat requires the user's own API key: it isn't bundled with the
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

  // Popular gallery loads once per source/sort/model and stays mounted:
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

  // Saves the key, then immediately probes it with a real request instead of
  // trusting that "the write succeeded" means "the key works" — MCStat only
  // tells us that on the next fetch. Throws on any failure so
  // `SingleFieldDialog` (which awaits this) keeps the dialog open instead of
  // closing on a key that's still wrong; only a successful probe switches
  // the source and closes it. The probe's own result becomes the gallery
  // (and `prevGalleryKey` is updated to match) so skins show up immediately
  // instead of flashing empty while a second, redundant fetch runs.
  const submitMcstatKey = async (key: string) => {
    const settings = await SettingsAPI.get()
    let keySaved = false
    try {
      await SettingsAPI.update({
        curseforgeApiKey: settings.curseforgeApiKey,
        mcstatApiKey: key,
      })
      keySaved = true
      const mcstatSortBy = defaultSortFor('mcstat')
      const data = await SkinAPI.search({
        source: 'mcstat',
        query: '',
        page: 1,
        sortBy: mcstatSortBy,
        model: null,
      })
      setMcstatApiKey(key)
      setSource('mcstat')
      setSortBy(mcstatSortBy)
      setModel('all')
      setMcstatKeyInvalid(false)
      setPrevGalleryKey(`mcstat:${mcstatSortBy}:null`)
      setPopularSkins(data)
      setPage(1)
      setHasMore(data.length > 0)
      setIsLoading(false)
    } catch (err) {
      if (isUnauthorized(err)) {
        setMcstatKeyInvalid(true)
        // The new key got persisted above before the probe revealed it's
        // bad — revert to whatever was saved before this attempt so an
        // invalid key never lingers in settings.json if the user closes
        // the dialog instead of trying again.
        SettingsAPI.update({
          curseforgeApiKey: settings.curseforgeApiKey,
          mcstatApiKey: settings.mcstatApiKey,
        }).catch(() => {})
      } else {
        toast.error(
          `Falha ao ${keySaved ? 'validar' : 'salvar'} chave: ${String(err)}`,
        )
      }
      throw err
    }
  }

  // MCStat returns 401 when the saved key is wrong/expired/revoked — surface
  // that as the key dialog reopening with a warning instead of a generic
  // toast, so the user immediately knows what to fix.
  const handleSkinsError = useCallback(
    (err: unknown, fallbackMessage: string) => {
      if (source === 'mcstat' && isUnauthorized(err)) {
        setMcstatKeyInvalid(true)
        setMcstatKeyDialogOpen(true)
        return
      }
      toast.error(`${fallbackMessage}: ${String(err)}`)
    },
    [source],
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
            handleSkinsError(err, 'Falha ao buscar skins'),
        )
    }, 200)
    return () => clearTimeout(handle)
  }, [source, query, sortBy, modelFilter, handleSkinsError])

  const loadMore = async () => {
    setIsLoadingMore(true)
    // Read (not bumped) up front: the gallery effect above increments this
    // ref on every source/sort/model change, so if it moved on by the time
    // this request settles, the user already switched away from the filter
    // combo this page belongs to — a late failure shouldn't reopen the
    // MCStat key dialog (or toast) on behalf of a screen that's gone.
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

  // Closing the dialog (cancel or successful save) always clears the
  // "invalid" warning so it doesn't linger stale the next time it opens.
  const handleMcstatKeyDialogOpenChange = (open: boolean) => {
    setMcstatKeyDialogOpen(open)
    if (!open) setMcstatKeyInvalid(false)
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
    setMcstatKeyDialogOpen: handleMcstatKeyDialogOpenChange,
    mcstatKeyInvalid,
    submitMcstatKey,
    handleSourceChange,
    loadMore,
    isSearching,
    matchedKeys,
    combined,
  }
}
