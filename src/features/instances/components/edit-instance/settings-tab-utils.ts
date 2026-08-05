import type { LoaderId } from '../create-instance/LoaderSelectionCard'

export const MIN_MEMORY_MB = 1024
export const FALLBACK_TOTAL_MEMORY_MB = 16384

export function toLoaderId(loader: string | null): LoaderId {
  return (loader as LoaderId | null) ?? 'vanilla'
}
