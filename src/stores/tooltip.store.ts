import { create } from 'zustand'
interface TooltipStore {
  label: string | null
  x: number
  y: number
  show: (label: string, x: number, y: number) => void
  move: (x: number, y: number) => void
  hide: () => void
}
export const useTooltipStore = create<TooltipStore>((set) => ({
  label: null,
  x: 0,
  y: 0,
  show: (label, x, y) => set({ label, x, y }),
  move: (x, y) => set({ x, y }),
  hide: () => set({ label: null }),
}))
