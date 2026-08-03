import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import type { SkinSummary } from '@/types/skins'

import { SkinCard } from '../components/SkinCard'
import { SkinDetailDialog } from '../components/SkinDetailDialog'
import { SkinAPI } from '../services/skin.api'

export function SkinsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [popularSkins, setPopularSkins] = useState<SkinSummary[]>([])
  const [matchedSkins, setMatchedSkins] = useState<SkinSummary[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedHash, setSelectedHash] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  useDiscordPresence('Navegando por skins', query.trim() || 'Galeria de skins')

  // Popular gallery loads once and stays mounted — searching never reloads or
  // unmounts these cards, it only overlays which ones match on top of them.
  useEffect(() => {
    SkinAPI.search({ query: '', page: 1, sortBy: 'popular-desc' })
      .then((data) => {
        setPopularSkins(data)
        setPage(1)
        setHasMore(data.length > 0)
      })
      .catch((err) => toast.error(`Falha ao buscar skins: ${String(err)}`))
      .finally(() => setIsLoading(false))
  }, [])

  // Clear search results during render when the query is emptied (the effect
  // below only performs the debounced fetch).
  const [prevQuery, setPrevQuery] = useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    if (!query.trim()) setMatchedSkins([])
  }

  useEffect(() => {
    const requestId = ++requestIdRef.current
    if (!query.trim()) return
    const handle = setTimeout(() => {
      SkinAPI.search({ query, page: 1, sortBy: 'popular-desc' })
        .then((data) => requestIdRef.current === requestId && setMatchedSkins(data))
        .catch((err) => requestIdRef.current === requestId && toast.error(`Falha ao buscar skins: ${String(err)}`))
    }, 200)
    return () => clearTimeout(handle)
  }, [query])

  const loadMore = async () => {
    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const data = await SkinAPI.search({ query: '', page: nextPage, sortBy: 'popular-desc' })
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
  const matchedHashes = new Set(matchedSkins.map((s) => s.hash))
  const combined = isSearching ? [...matchedSkins, ...popularSkins.filter((s) => !matchedHashes.has(s.hash))] : popularSkins

  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Skins" onBack={() => navigate('/')}>
        <SearchInput
          containerClassName="ml-4 w-full max-w-xs"
          placeholder="Pesquisar por nome de jogador..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <CenteredSpinner className="h-64" />
        ) : combined.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma skin encontrada.</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 xl:grid-cols-8">
              {combined.map((skin) => (
                <motion.div key={skin.hash} layout transition={{ type: 'spring', stiffness: 350, damping: 32 }}>
                  <SkinCard
                    skin={skin}
                    matched={isSearching && matchedHashes.has(skin.hash)}
                    dimmed={isSearching && !matchedHashes.has(skin.hash)}
                    onClick={() => setSelectedHash(skin.hash)}
                  />
                </motion.div>
              ))}
            </div>
            {!isSearching && hasMore && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <SkinDetailDialog hash={selectedHash} onOpenChange={(open) => !open && setSelectedHash(null)} />
    </div>
  )
}
