import { useEffect } from 'react'
import { apiInvoke } from '@/lib/api/client'
export function useDiscordPresence(details: string, state: string) {
  useEffect(() => {
    apiInvoke<void>('discord_set_presence', {
      details,
      activityState: state,
    }).catch(() => {})
  }, [details, state])
}
