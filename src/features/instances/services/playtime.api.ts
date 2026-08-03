import { apiInvoke } from '@/lib/api/client'
import type { PlaytimeSummary } from '@/types/playtime'

export const PlaytimeAPI = {
  getSummary(id: string): Promise<PlaytimeSummary> {
    return apiInvoke<PlaytimeSummary>('get_playtime_summary', { id })
  },
}
