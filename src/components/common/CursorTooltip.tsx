import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'

import { useTooltipStore } from '@/stores/tooltip.store'

const OFFSET = 14
const MARGIN = 8

/** Renders the tooltip driven by `tooltipProps()` (src/lib/tooltip.ts):
 * mount once at the app root. Follows the cursor at a fixed diagonal
 * offset (bottom-right by default), flipping horizontally/vertically
 * whenever it would otherwise overflow the window. */
export function CursorTooltip() {
  const label = useTooltipStore((s) => s.label)
  const x = useTooltipStore((s) => s.x)
  const y = useTooltipStore((s) => s.y)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const { pathname } = useLocation()

  // A route change can unmount the hovered trigger without ever firing its
  // onMouseLeave (e.g. clicking a nav button whose own click handler swaps
  // the page), leaving the tooltip stuck on screen until something else
  // hovers and overwrites it. Hide it outright whenever the route changes.
  useEffect(() => {
    useTooltipStore.getState().hide()
  }, [pathname])

  // Same root problem as the route change above, but for anything that
  // unmounts a hovered trigger without moving the mouse off it first: most
  // commonly closing a dialog (its close button, an "X", a click outside,
  // or Escape). Every one of those goes through a click or a keydown, so
  // hiding on both catches the whole class of "tooltip survives its own
  // trigger's dialog closing" bugs generically, without wiring anything
  // dialog-specific.
  // Same root problem again, but for the OS's own native file picker
  // (opened from inside dialogs like the icon upload modal): the webview
  // loses focus while it's open, with no click/keydown of ours in between,
  // so the trigger's tooltip is still "shown" by the time focus returns and
  // the dialog closes right after the user picks a file.
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
