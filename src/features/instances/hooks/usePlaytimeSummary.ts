import { useEffect, useState } from 'react'
import { getCached } from '@/lib/sessionCache'
import { PlaytimeAPI } from '@/features/instances/services/playtime.api'
import type { InstanceDTO } from '@/types/instance'
import type { PlaytimeSummary } from '@/types/playtime'
const POLL_INTERVAL_MS = 1000
export function usePlaytimeSummary(
  instance: InstanceDTO,
  isRunning = false,
): {
  summary: PlaytimeSummary | null
} {
  const [summary, setSummary] = useState<PlaytimeSummary | null>(null)
  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      PlaytimeAPI.getSummary(instance.id)
        .then((data) => {
          if (!cancelled) setSummary(data)
        })
        .catch(() => {})
    }
    if (isRunning) {
      refresh()
      const interval = setInterval(refresh, POLL_INTERVAL_MS)
      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }
    const key = `${instance.id}:${instance.playtimeSeconds}:${instance.lastPlayed}`
    getCached(key, () => PlaytimeAPI.getSummary(instance.id))
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [instance.id, instance.playtimeSeconds, instance.lastPlayed, isRunning])
  return { summary }
}
