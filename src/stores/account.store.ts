import { create } from 'zustand'

import { AccountAPI } from '@/features/accounts/services/account.api'
import type {
  AccountDTO,
  CreateAccountInput,
  UpdateAccountInput,
} from '@/types/account'

interface AccountStore {
  accounts: AccountDTO[]
  isLoading: boolean
  error: string | null

  fetchAccounts: () => Promise<void>
  createAccount: (input: CreateAccountInput) => Promise<void>
  updateAccount: (input: UpdateAccountInput) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  setDefaultAccount: (id: string) => Promise<void>
  reorderAccounts: (orderedIds: string[]) => Promise<void>
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null })
    try {
      const accounts = await AccountAPI.list()
      set({ accounts, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: String(err) })
    }
  },

  createAccount: async (input) => {
    const account = await AccountAPI.create(input)
    set((state) => ({ accounts: [...state.accounts, account] }))
  },

  updateAccount: async (input) => {
    const account = await AccountAPI.update(input)
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
    }))
  },

  deleteAccount: async (id) => {
    await AccountAPI.delete(id)
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }))
  },

  setDefaultAccount: async (id) => {
    await AccountAPI.setDefault(id)
    set((state) => ({
      accounts: state.accounts.map((a) => ({ ...a, isDefault: a.id === id })),
    }))
  },

  reorderAccounts: async (orderedIds) => {
    const byId = new Map(get().accounts.map((a) => [a.id, a]))
    const reordered = orderedIds.map((id) => byId.get(id)!).filter(Boolean)
    set({ accounts: reordered })
    await AccountAPI.reorder(orderedIds)
  },
}))

export function useDefaultAccount(): AccountDTO | null {
  return useAccountStore(
    (state) => state.accounts.find((a) => a.isDefault) ?? null,
  )
}
