import type { MouseEvent } from 'react'

import { useTooltipStore } from '@/stores/tooltip.store'

/** Spread onto any element in place of a native `title` attribute — drives
 * the custom cursor-following tooltip (see CursorTooltip.tsx) instead of
 * the browser's own delayed, fixed-position tooltip. Safe to call anywhere,
 * including inside `.map()`, since it only touches the zustand store's
 * imperative API rather than calling a hook. */
export function tooltipProps(label: string | null | undefined) {
  if (!label) return {}
  return {
    onMouseEnter: (e: MouseEvent) =>
      useTooltipStore.getState().show(label, e.clientX, e.clientY),
    onMouseMove: (e: MouseEvent) =>
      useTooltipStore.getState().move(e.clientX, e.clientY),
    onMouseLeave: () => useTooltipStore.getState().hide(),
  }
}
