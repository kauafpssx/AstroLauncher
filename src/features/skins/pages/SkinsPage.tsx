import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
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
  } = useSkinsBrowser()

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
