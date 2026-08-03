import { open as openInBrowser } from '@tauri-apps/plugin-shell'
import { create } from 'zustand'

interface LinkPreviewStore {
  open: (url: string) => void
}

export const useLinkPreviewStore = create<LinkPreviewStore>(() => ({
  open: (url) => {
    void openInBrowser(url)
  },
}))
