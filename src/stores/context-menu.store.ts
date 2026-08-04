import { create } from 'zustand'

interface ContextMenuStore {
  openId: string | null
  setOpenId: (id: string | null) => void
}

/** Tracks which `EntityContextMenu` instance is currently open across the
 * whole app, so right-clicking a second trigger closes the first instead of
 * leaving two menus open at once. */
export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  openId: null,
  setOpenId: (id) => set({ openId: id }),
}))
