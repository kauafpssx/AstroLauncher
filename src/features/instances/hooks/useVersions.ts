import { useCallback, useEffect, useState } from 'react'

import { VersionAPI } from '@/features/instances/services/version.api'
import type { VersionDTO } from '@/types/version'

// The version manifest barely changes between app runs, so the last loaded
// list is kept in memory: revisiting the create-instance screen renders it
// instantly while the background fetch refreshes it (stale-while-revalidate).
let cachedVersions: VersionDTO[] | null = null

export function useVersions() {
  const [versions, setVersions] = useState<VersionDTO[]>(cachedVersions ?? [])
  const [isLoading, setIsLoading] = useState(cachedVersions === null)
  const [error, setError] = useState<string | null>(null)

  const fetchVersions = useCallback(async () => {
    try {
      const data = await VersionAPI.list()
      cachedVersions = data
      setVersions(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    VersionAPI.list()
      .then((data) => {
        if (cancelled) return
        cachedVersions = data
        setVersions(data)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { versions, isLoading, error, refetch: fetchVersions }
}
