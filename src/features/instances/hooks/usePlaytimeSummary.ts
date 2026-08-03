import { useEffect, useState } from 'react'

import { PlaytimeAPI } from '../services/playtime.api'
import type { InstanceDTO } from '@/types/instance'
import type { PlaytimeSummary } from '@/types/playtime'

/// While the game is running the backend already surfaces the live total
/// (stored playtime + elapsed time of the open session), so a per-second
/// refresh is enough to make the UI tick in real time. When it exits, the
/// `instance://stopped` event reloads the instance list, which bumps
/// `playtimeSeconds`/`lastPlayed` and re-runs this effect with the final total.
const POLL_INTERVAL_MS = 1000

export function usePlaytimeSummary(
  instance: InstanceDTO,
  isRunning = false,
): { summary: PlaytimeSummary | null } {
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

    refresh()

    if (!isRunning) {
      return () => {
        cancelled = true
      }
    }

    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [instance.id, instance.playtimeSeconds, instance.lastPlayed, isRunning])

  return { summary }
}
