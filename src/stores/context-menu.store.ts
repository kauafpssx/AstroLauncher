import { create } from 'zustand'
interface ContextMenuStore {
  openId: string | null
  setOpenId: (id: string | null) => void
}
export const useContextMenuStore = create<ContextMenuStore>((set) => ({
  openId: null,
  setOpenId: (id) => set({ openId: id }),
}))
