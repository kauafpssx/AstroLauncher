import { useCallback, useEffect, useRef, useState } from 'react'
interface UseInfiniteScrollArgs {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
}
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
}: UseInfiniteScrollArgs) {
  const viewportRef = useRef<HTMLDivElement>(null)
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
