import { create } from 'zustand'

interface TooltipStore {
  label: string | null
  x: number
  y: number
  show: (label: string, x: number, y: number) => void
  move: (x: number, y: number) => void
  hide: () => void
}

/** Backs the app's cursor-following tooltip (see CursorTooltip.tsx) — a
 * plain store rather than context so `tooltipProps()` can call
 * `.getState()` imperatively from anywhere, including inside `.map()`
 * callbacks, without breaking the rules of hooks. */
export const useTooltipStore = create<TooltipStore>((set) => ({
  label: null,
  x: 0,
  y: 0,
  show: (label, x, y) => set({ label, x, y }),
  move: (x, y) => set({ x, y }),
  hide: () => set({ label: null }),
}))
