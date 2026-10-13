import type { LoaderId } from '@/features/instances/components/create-instance/custom/LoaderSelectionCard'
export const MIN_MEMORY_MB = 1024
export const FALLBACK_TOTAL_MEMORY_MB = 16384
export const DEFAULT_WINDOW_WIDTH = 854
export const DEFAULT_WINDOW_HEIGHT = 480
export const MIN_WINDOW_SIZE = 320
export const MAX_WINDOW_WIDTH = 7680
export const MAX_WINDOW_HEIGHT = 4320
export function toLoaderId(loader: string | null): LoaderId {
  return (loader as LoaderId | null) ?? 'vanilla'
}
