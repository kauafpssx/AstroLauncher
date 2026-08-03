import { useCallback, useEffect, useState } from 'react'

import { VersionAPI } from '@/features/instances/services/version.api'
import type { VersionDTO } from '@/types/version'

export function useVersions() {
  const [versions, setVersions] = useState<VersionDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVersions = useCallback(async () => {
    try {
      const data = await VersionAPI.list()
      setVersions(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    VersionAPI.list()
      .then(setVersions)
      .catch((err) => setError(String(err)))
      .finally(() => setIsLoading(false))
  }, [])

  return { versions, isLoading, error, refetch: fetchVersions }
}
