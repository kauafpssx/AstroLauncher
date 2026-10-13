import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { useTooltipStore } from '@/stores/tooltip.store'
const OFFSET = 14
const MARGIN = 8
export function CursorTooltip() {
  const label = useTooltipStore((s) => s.label)
  const x = useTooltipStore((s) => s.x)
  const y = useTooltipStore((s) => s.y)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{
    left: number
    top: number
  } | null>(null)
  const { pathname } = useLocation()
  useEffect(() => {
    useTooltipStore.getState().hide()
  }, [pathname])
  useEffect(() => {
    const hide = () => useTooltipStore.getState().hide()
    document.addEventListener('click', hide, true)
    document.addEventListener('keydown', hide, true)
    window.addEventListener('blur', hide)
    return () => {
      document.removeEventListener('click', hide, true)
      document.removeEventListener('keydown', hide, true)
      window.removeEventListener('blur', hide)
    }
  }, [])
  useLayoutEffect(() => {
    if (!label || !ref.current) {
      setPos(null)
      return
    }
    const { width, height } = ref.current.getBoundingClientRect()
    let left = x + OFFSET
    let top = y + OFFSET
    if (left + width > window.innerWidth - MARGIN) left = x - OFFSET - width
    if (top + height > window.innerHeight - MARGIN) top = y - OFFSET - height
    left = Math.max(MARGIN, left)
    top = Math.max(MARGIN, top)
    setPos({ left, top })
  }, [label, x, y])
  if (!label) return null
  return createPortal(
    <div
      ref={ref}
      className="bg-foreground text-background pointer-events-none fixed z-[100] w-fit max-w-xs rounded-md px-3 py-1.5 text-xs"
      style={{
        left: pos?.left ?? x + OFFSET,
        top: pos?.top ?? y + OFFSET,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {label}
    </div>,
    document.body,
  )
}
