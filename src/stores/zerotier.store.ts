import { create } from 'zustand'

import { ZeroTierAPI } from '@/features/network/services/zerotier.api'
import type { ZeroTierStatusDTO } from '@/types/zerotier'

interface ZeroTierStore {
  status: ZeroTierStatusDTO | null
  isLoading: boolean
  error: string | null
  // Mirrors `useModpackInstallStore`'s `isInstalling` flag: a long-running
  // op other parts of the UI (tabs, dialog close) read to stay disabled
  // until it settles, instead of each screen tracking its own busy state.
  leavingNetworkId: string | null

  refreshStatus: () => Promise<void>
  join: (networkId: string) => Promise<void>
  leave: (networkId: string) => Promise<void>
}

export const useZeroTierStore = create<ZeroTierStore>((set, get) => ({
  status: null,
  isLoading: false,
  error: null,
  leavingNetworkId: null,

  refreshStatus: async () => {
    if (!get().status) set({ isLoading: true })
    try {
      const status = await ZeroTierAPI.status()
      set({ status, isLoading: false, error: null })
    } catch (err) {
      set({ isLoading: false, error: String(err) })
    }
  },

  join: async (networkId) => {
    await ZeroTierAPI.join(networkId)
    await get().refreshStatus()
  },

  leave: async (networkId) => {
    set({ leavingNetworkId: networkId })
    try {
      await ZeroTierAPI.leave(networkId)
      await get().refreshStatus()
    } finally {
      set({ leavingNetworkId: null })
    }
  },
}))
