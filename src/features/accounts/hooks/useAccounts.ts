import { useEffect } from 'react'

import { useAccountStore } from '@/stores/account.store'

export function useAccounts() {
  const accounts = useAccountStore((s) => s.accounts)
  const isLoading = useAccountStore((s) => s.isLoading)
  const error = useAccountStore((s) => s.error)
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts)

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return { accounts, isLoading, error }
}
