import { listen } from '@tauri-apps/api/event'
import { create } from 'zustand'

import { apiInvoke } from '@/lib/api/client'

interface ImportAstropackStore {
  pendingPath: string | null
  clearPending: () => void
}

/** Holds a `.astropack` file path the app was opened with via its file
 * association — either at cold start or forwarded from a second launch
 * attempt while already running (see `stores/launch.store.ts` for the
 * matching `--launch-instance` flow). */
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
