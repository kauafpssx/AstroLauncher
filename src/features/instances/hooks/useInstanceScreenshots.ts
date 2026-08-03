import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { ScreenshotDTO } from '@/types/screenshot'

import { InstanceWorkspaceAPI } from '../services/instance-workspace.api'

export interface LoadedScreenshot {
  info: ScreenshotDTO
  dataUri: string
}

export function useInstanceScreenshots(instanceId: string) {
  const [shots, setShots] = useState<LoadedScreenshot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const requestId = ++requestIdRef.current
    InstanceWorkspaceAPI.listScreenshots(instanceId)
      .then(async (list) => {
        const loaded = await Promise.all(
          list.map(async (info) => ({
            info,
            dataUri: await InstanceWorkspaceAPI.readScreenshot(instanceId, info.name),
          })),
        )
        if (requestIdRef.current === requestId) setShots(loaded)
      })
      .catch((err) => {
        if (requestIdRef.current === requestId) toast.error(`Falha ao carregar screenshots: ${String(err)}`)
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setIsLoading(false)
      })
  }, [instanceId])

  return { shots, isLoading, setShots }
}
