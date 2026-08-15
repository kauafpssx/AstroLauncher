import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'

import { McstatApiKeyDialog } from '../components/McstatApiKeyDialog'
import { SkinCard } from '../components/SkinCard'
import { SkinDetailDialog } from '../components/SkinDetailDialog'
import { SkinsToolbar } from '../components/SkinsToolbar'
import { skinKey, useSkinsBrowser } from './useSkinsBrowser'

export function SkinsPage() {
  const navigate = useNavigate()
  const {
    source,
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
    mcstatKeyDialogOpen,
    setMcstatKeyDialogOpen,
    mcstatKeyInvalid,
    submitMcstatKey,
    handleSourceChange,
    loadMore,
    isSearching,
    matchedKeys,
    combined,
  } = useSkinsBrowser()

  const scrollRef = useRef<HTMLDivElement>(null)

  // Searching overlays matches on top of the gallery in place: without this,
  // typing a query while scrolled down leaves the matches out of view above
  // the fold instead of jumping the list back to the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [query])

  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Skins" onBack={() => navigate('/')}>
        <SkinsToolbar
          source={source}
          sortBy={sortBy}
          setSortBy={setSortBy}
          model={model}
          setModel={setModel}
          query={query}
          setQuery={setQuery}
          onSourceChange={handleSourceChange}
          onOpenKeyDialog={() => setMcstatKeyDialogOpen(true)}
        />
      </PageHeader>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <CenteredSpinner className="h-full" />
        ) : combined.length === 0 ? (
          <EmptyState title="Nenhuma skin encontrada." className="p-8" />
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
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
        invalidKey={mcstatKeyInvalid}
        onOpenChange={setMcstatKeyDialogOpen}
        onSubmit={submitMcstatKey}
      />
    </div>
  )
}
