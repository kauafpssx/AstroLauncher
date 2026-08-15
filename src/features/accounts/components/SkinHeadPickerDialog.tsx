import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchInput } from '@/components/common/SearchInput'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'

import { SkinHeadThumbnail } from './SkinHeadThumbnail'
import { useSkinHeadPicker } from './useSkinHeadPicker'

interface SkinHeadPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (base64Png: string) => void
}

/** Picks a skin from PlayerMC (same search API as the skins gallery) and
 * hands back just its cropped head as a base64 PNG, for use as an account
 * avatar. */
export function SkinHeadPickerDialog({
  open,
  onOpenChange,
  onPick,
}: SkinHeadPickerDialogProps) {
  const {
    query,
    setQuery,
    results,
    isSearching,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    isActivelySearching,
    matchedKeys,
  } = useSkinHeadPicker(open)

  const { viewportRef, sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: loadMore,
  })

  // Searching overlays matches on top of the list in place: without this,
  // typing a query while scrolled down leaves the matches out of view above
  // the fold instead of jumping the list back to the top.
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0 })
  }, [query, viewportRef])

  const handlePick = (base64Png: string) => {
    onPick(base64Png)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher avatar</DialogTitle>
          <DialogDescription>
            Busque uma skin e use a cabeça dela como avatar da conta.
          </DialogDescription>
        </DialogHeader>

        <SearchInput
          placeholder="Buscar skins..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {error && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Não foi possível buscar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSearching ? (
          <CenteredSpinner className="h-72" />
        ) : (
          <ScrollArea type="always" className="h-72" viewportRef={viewportRef}>
            {!error && results.length === 0 ? (
              <EmptyState title="Nenhuma skin encontrada." className="p-4" />
            ) : (
              <div className="grid grid-cols-6 gap-1 p-1">
                {results.map((skin) => {
                  const key = `${skin.source}:${skin.id}`
                  return (
                    <motion.div
                      key={key}
                      layout
                      transition={{
                        type: 'spring',
                        stiffness: 350,
                        damping: 32,
                      }}
                    >
                      <SkinHeadThumbnail
                        skin={skin}
                        matched={isActivelySearching && matchedKeys.has(key)}
                        dimmed={isActivelySearching && !matchedKeys.has(key)}
                        onPick={handlePick}
                      />
                    </motion.div>
                  )
                })}
              </div>
            )}
            {hasMore && <div ref={sentinelRef} className="h-4" />}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
