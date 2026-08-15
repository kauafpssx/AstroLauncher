import { useCallback, useEffect, useRef, useState } from 'react'

interface UseInfiniteScrollArgs {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
}

/** Loads more results as a sentinel element nears the viewport's bottom.
 * Attach `viewportRef` to the scroll container (e.g. `ScrollArea`'s
 * `viewportRef`) and `sentinelRef` to a marker element at the end of the
 * list. */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
}: UseInfiniteScrollArgs) {
  const viewportRef = useRef<HTMLDivElement>(null)
  // A callback ref instead of a plain `useRef`: when the sentinel mounts
  // later than the hook itself (e.g. behind a loading spinner that only
  // renders the list once data has arrived), a plain ref's `.current`
  // change wouldn't re-run the observer effect below since it isn't
  // reactive state — the sentinel would silently never get observed.
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null)
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    setSentinel(node)
  }, [])
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  })

  useEffect(() => {
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current()
      },
      { root: viewportRef.current, rootMargin: '200px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinel, hasMore, isLoading])

  return { viewportRef, sentinelRef }
}
