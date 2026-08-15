import { useEffect, useRef, useState } from 'react'

import { SkinAPI } from '@/features/skins/services/skin.api'
import type { SkinSummary } from '@/types/skins'

function skinKey(skin: SkinSummary) {
  return `${skin.source}:${skin.id}`
}

/** Search state for the account avatar picker: a trimmed-down version of the
 * full skin gallery (`useSkinsBrowser`) — PlayerMC only, no API key gating —
 * but keeping the same popular-gallery + search-overlay architecture, so
 * search results surface on top of (not instead of) the standing gallery. */
export function useSkinHeadPicker(open: boolean) {
  const [query, setQuery] = useState('')
  const [popularSkins, setPopularSkins] = useState<SkinSummary[]>([])
  const [matchedSkins, setMatchedSkins] = useState<SkinSummary[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isSearching, setIsSearching] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const galleryRequestIdRef = useRef(0)
  const searchRequestIdRef = useRef(0)

  // Reset search state when the dialog (re)opens, not when it closes: the
  // close animation keeps the content mounted for a moment, and clearing
  // state right away would flash an empty/error state during that fade-out
  // instead of just showing the last picked skin's context until it's gone.
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) {
      setQuery('')
      setPopularSkins([])
      setMatchedSkins([])
      setPage(1)
      setHasMore(true)
      setError(null)
      setIsSearching(true)
    }
  }

  useEffect(() => {
    if (!open) return
    const requestId = ++galleryRequestIdRef.current
    SkinAPI.search({
      source: 'playermc',
      query: '',
      page: 1,
      sortBy: 'popular-desc',
      model: null,
    })
      .then((data) => {
        if (galleryRequestIdRef.current !== requestId) return
        setPopularSkins(data)
        setPage(1)
        setHasMore(data.length > 0)
      })
      .catch((err) => {
        if (galleryRequestIdRef.current !== requestId) return
        setError(String(err))
      })
      .finally(() => {
        if (galleryRequestIdRef.current === requestId) setIsSearching(false)
      })
  }, [open])

  // Clear search results during render when the query is emptied (the effect
  // below only performs the debounced fetch).
  const [prevQuery, setPrevQuery] = useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    if (!query.trim()) setMatchedSkins([])
  }

  useEffect(() => {
    if (!open || !query.trim()) return
    const requestId = ++searchRequestIdRef.current
    const handle = setTimeout(() => {
      SkinAPI.search({
        source: 'playermc',
        query,
        page: 1,
        sortBy: 'popular-desc',
        model: null,
      })
        .then((data) => {
          if (searchRequestIdRef.current === requestId) setMatchedSkins(data)
        })
        .catch((err) => {
          if (searchRequestIdRef.current === requestId) setError(String(err))
        })
    }, 200)
    return () => clearTimeout(handle)
  }, [open, query])

  const loadMore = () => {
    if (isSearching || isLoadingMore || !hasMore) return
    const requestId = galleryRequestIdRef.current
    const nextPage = page + 1
    setIsLoadingMore(true)
    SkinAPI.search({
      source: 'playermc',
      query: '',
      page: nextPage,
      sortBy: 'popular-desc',
      model: null,
    })
      .then((data) => {
        if (galleryRequestIdRef.current !== requestId) return
        setPopularSkins((prev) => [...prev, ...data])
        setPage(nextPage)
        setHasMore(data.length > 0)
      })
      .catch((err) => {
        if (galleryRequestIdRef.current !== requestId) return
        setError(String(err))
      })
      .finally(() => {
        if (galleryRequestIdRef.current === requestId) setIsLoadingMore(false)
      })
  }

  const isActivelySearching = query.trim().length > 0
  const matchedKeys = new Set(matchedSkins.map(skinKey))
  const combined = isActivelySearching
    ? [
        ...matchedSkins,
        ...popularSkins.filter((s) => !matchedKeys.has(skinKey(s))),
      ]
    : popularSkins

  return {
    query,
    setQuery,
    results: combined,
    isSearching,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    isActivelySearching,
    matchedKeys,
  }
}
