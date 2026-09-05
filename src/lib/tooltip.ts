import type { MouseEvent } from 'react'
import { useTooltipStore } from '@/stores/tooltip.store'
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
