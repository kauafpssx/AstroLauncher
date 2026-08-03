import { useEffect } from 'react'

import { apiInvoke } from '@/lib/api/client'

/** Reflects the current screen in Discord Rich Presence. Backend-driven
 * flows (modpack install, mod download, playing) set their own presence and
 * revert automatically when done — this only covers screens with no
 * long-running backend operation attached to them. */
export function useDiscordPresence(details: string, state: string) {
  useEffect(() => {
    apiInvoke<void>('discord_set_presence', { details, activityState: state }).catch(() => {})
  }, [details, state])
}
