import { motion } from 'framer-motion'
import { ArrowDown, KeyRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import { tooltipProps } from '@/lib/tooltip'
import type {
  McstatSortBy,
  PlayerMcSortBy,
  SkinModel,
  SkinSortBy,
  SkinSource,
  SkinSummary,
} from '@/types/skins'

import { McstatApiKeyDialog } from '../components/McstatApiKeyDialog'
import { SkinCard } from '../components/SkinCard'
import { SkinDetailDialog } from '../components/SkinDetailDialog'
import { SkinAPI } from '../services/skin.api'

const SOURCES: { id: SkinSource; label: string; icon: string }[] = [
  { id: 'playermc', label: 'PlayerMC', icon: '/skins/playermc.ico' },
  { id: 'mcstat', label: 'MCStat', icon: '/skins/mcstat.ico' },
]

const PLAYERMC_SORTS: { value: PlayerMcSortBy; label: string }[] = [
  { value: 'popular-desc', label: 'Mais populares' },
  { value: 'popular-asc', label: 'Menos populares' },
]

const MCSTAT_SORTS: { value: McstatSortBy; label: string }[] = [
  { value: 'popular', label: 'Populares' },
  { value: 'trending', label: 'Em alta' },
  { value: 'recent', label: 'Recentes' },
]

const MODEL_FILTERS: { value: 'all' | SkinModel; label: string }[] = [
  { value: 'all', label: 'Todos os modelos' },
  { value: 'classic', label: 'Classic' },
  { value: 'slim', label: 'Slim' },
]

const SORTS_BY_SOURCE: Record<
  SkinSource,
  { value: SkinSortBy; label: string }[]
> = {
  playermc: PLAYERMC_SORTS,
  mcstat: MCSTAT_SORTS,
}

function defaultSortFor(source: SkinSource): SkinSortBy {
  return source === 'mcstat' ? 'popular' : 'popular-desc'
}

function skinKey(skin: SkinSummary) {
  return `${skin.source}:${skin.id}`
}

export function SkinsPage() {
  const navigate = useNavigate()
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

  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Skins" onBack={() => navigate('/')}>
        <SearchInput
          containerClassName="ml-4 w-full max-w-xs"
          placeholder="Pesquisar por nome de jogador..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as SkinSortBy)}
        >
          <SelectTrigger size="sm" className="ml-auto w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS_BY_SOURCE[source].map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {source === 'mcstat' && (
          <Select
            value={model}
            onValueChange={(v) => setModel(v as 'all' | SkinModel)}
          >
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_FILTERS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <ToggleGroup
          type="single"
          value={source}
          onValueChange={(v) => v && handleSourceChange(v as SkinSource)}
        >
          {SOURCES.map((s) => (
            <ToggleGroupItem key={s.id} value={s.id}>
              <img src={s.icon} alt="" className="size-4" /> {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {source === 'mcstat' && (
          <Button
            variant="ghost"
            size="icon"
            {...tooltipProps('Alterar chave de API do MCStat')}
            onClick={() => setMcstatKeyDialogOpen(true)}
          >
            <KeyRound />
          </Button>
        )}
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <CenteredSpinner className="h-64" />
        ) : combined.length === 0 ? (
          <EmptyState title="Nenhuma skin encontrada." className="p-8" />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 xl:grid-cols-8">
              {combined.map((skin) => {
                const key = skinKey(skin)
                return (
                  <motion.div
                    key={key}
                    layout
                    transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                  >
                    <SkinCard
                      skin={skin}
                      matched={isSearching && matchedKeys.has(key)}
                      dimmed={isSearching && !matchedKeys.has(key)}
                      onClick={() => setSelected(skin)}
                    />
                  </motion.div>
                )
              })}
            </div>
            {!isSearching && hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    'Carregando...'
                  ) : (
                    <>
                      Carregar mais <ArrowDown />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <SkinDetailDialog
        source={selected?.source ?? null}
        id={selected?.id ?? null}
        onOpenChange={(open) => !open && setSelected(null)}
      />

      <McstatApiKeyDialog
        open={mcstatKeyDialogOpen}
        currentKey={mcstatApiKey}
        onOpenChange={setMcstatKeyDialogOpen}
        onSaved={(key) => {
          setMcstatApiKey(key)
          setSource('mcstat')
        }}
      />
    </div>
  )
}
