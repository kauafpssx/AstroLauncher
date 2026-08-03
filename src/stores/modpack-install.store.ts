import { create } from 'zustand'

interface ModpackInstallStore {
  isInstalling: boolean
  setInstalling: (value: boolean) => void
}

export const useModpackInstallStore = create<ModpackInstallStore>((set) => ({
  isInstalling: false,
  setInstalling: (value) => set({ isInstalling: value }),
}))
