import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  BIOME_CATEGORY_LABELS_PT,
  type BiomeCategory,
} from '@/data/biome-metadata'
import { cn } from '@/lib/utils'
const DRAG_THRESHOLD_PX = 5
export function DraggableCategoryChips({
  categories,
  selected,
  onValueChange,
}: {
  categories: BiomeCategory[]
  selected: Set<BiomeCategory>
  onValueChange: (next: Set<BiomeCategory>) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    suppressClick: false,
  })
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const updateScrollButtons = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateScrollButtons()
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    const ro = new ResizeObserver(updateScrollButtons)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      ro.disconnect()
    }
  }, [updateScrollButtons])
  useEffect(() => {
    updateScrollButtons()
  }, [categories, updateScrollButtons])
  const windowHandlersRef = useRef<{
    move: (e: MouseEvent) => void
    up: () => void
  } | null>(null)
  const cleanupWindowHandlers = useCallback(() => {
    const handlers = windowHandlersRef.current
    if (handlers) {
      window.removeEventListener('mousemove', handlers.move)
      window.removeEventListener('mouseup', handlers.up)
      windowHandlersRef.current = null
    }
  }, [])
  const handleWindowMouseMove = useCallback((e: MouseEvent) => {
    const state = dragRef.current
    const scroller = scrollerRef.current
    if (!scroller) return
    const dx = e.clientX - state.startX
    if (!state.moved && Math.abs(dx) > DRAG_THRESHOLD_PX) {
      state.moved = true
      state.suppressClick = true
    }
    if (state.moved) {
      scroller.scrollLeft = state.startScrollLeft - dx
    }
  }, [])
  const handleWindowMouseUp = useCallback(() => {
    cleanupWindowHandlers()
    dragRef.current.moved = false
    setIsDragging(false)
  }, [cleanupWindowHandlers])
  useEffect(() => cleanupWindowHandlers, [cleanupWindowHandlers])
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      const scroller = scrollerRef.current
      if (!scroller) return
      e.preventDefault()
      dragRef.current = {
        startX: e.clientX,
        startScrollLeft: scroller.scrollLeft,
        moved: false,
        suppressClick: false,
      }
      setIsDragging(true)
      cleanupWindowHandlers()
      windowHandlersRef.current = {
        move: handleWindowMouseMove,
        up: handleWindowMouseUp,
      }
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
    },
    [cleanupWindowHandlers, handleWindowMouseMove, handleWindowMouseUp],
  )
  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={!canScrollLeft}
        onClick={() => {
          scrollerRef.current?.scrollBy({ left: -120, behavior: 'smooth' })
        }}
      >
        <ChevronLeft className="size-3.5" />
      </Button>
      <div className="h-7 min-w-0 flex-1 overflow-hidden">
        <div
          ref={scrollerRef}
          onMouseDown={handleMouseDown}
          onClickCapture={(e) => {
            if (dragRef.current.suppressClick) {
              dragRef.current.suppressClick = false
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          className={cn(
            'no-scrollbar -mb-6 overflow-x-auto pb-6',
            isDragging
              ? 'cursor-grabbing select-none'
              : 'cursor-grab select-none',
          )}
        >
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            spacing={1}
            className="flex w-max flex-nowrap"
            value={[...selected]}
            onValueChange={(vals) =>
              onValueChange(new Set(vals as BiomeCategory[]))
            }
          >
            {categories.map((category) => (
              <ToggleGroupItem
                key={category}
                value={category}
                className={cn(
                  'text-xs whitespace-nowrap',
                  isDragging ? 'cursor-grabbing' : 'cursor-grab',
                )}
              >
                {BIOME_CATEGORY_LABELS_PT[category]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={!canScrollRight}
        onClick={() => {
          scrollerRef.current?.scrollBy({ left: 120, behavior: 'smooth' })
        }}
      >
        <ChevronRight className="size-3.5" />
      </Button>
    </div>
  )
}
