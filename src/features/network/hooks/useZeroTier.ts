import { useEffect, useRef } from 'react'

import { useZeroTierStore } from '@/stores/zerotier.store'

const POLL_INTERVAL_MS = 3000

/** Polls ZeroTier status while `active` (i.e. the dialog is open) since the
 * daemon has no push-event channel into the app. */
export function useZeroTier(active: boolean) {
  const {
    status,
    isLoading,
    error,
    leavingNetworkId,
    refreshStatus,
    join,
    leave,
  } = useZeroTierStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      return
    }
    refreshStatus()
    intervalRef.current = setInterval(refreshStatus, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return {
    status,
    isLoading,
    error,
    leavingNetworkId,
    refreshStatus,
    join,
    leave,
  }
}
