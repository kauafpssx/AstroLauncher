import { listen } from '@tauri-apps/api/event'
import { create } from 'zustand'
import { apiInvoke } from '@/lib/api/client'
interface ImportAstropackStore {
  pendingPath: string | null
  clearPending: () => void
}
export const useImportAstropackStore = create<ImportAstropackStore>((set) => ({
  pendingPath: null,
  clearPending: () => set({ pendingPath: null }),
}))
apiInvoke<string | null>('take_pending_astropack_path').then((path) => {
  if (path) useImportAstropackStore.setState({ pendingPath: path })
})
listen<string>('shortcut://import-astropack', (event) => {
  useImportAstropackStore.setState({ pendingPath: event.payload })
})
