import { useLaunchStore } from '@/stores/launch.store'

export function useLaunchInstance() {
  const launch = useLaunchStore((s) => s.launch)
  const stop = useLaunchStore((s) => s.stop)
  const runningId = useLaunchStore((s) => s.runningInstanceId)

  return { launch, stop, runningId }
}
