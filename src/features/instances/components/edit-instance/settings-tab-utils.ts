import type { LoaderId } from '../create-instance/LoaderSelectionCard'

export const MIN_MEMORY_MB = 1024
export const FALLBACK_TOTAL_MEMORY_MB = 16384

// Vanilla Minecraft's own default window size — used both as the display
// fallback while no custom resolution is set and as sane input bounds.
export const DEFAULT_WINDOW_WIDTH = 854
export const DEFAULT_WINDOW_HEIGHT = 480
export const MIN_WINDOW_SIZE = 320
export const MAX_WINDOW_WIDTH = 7680
export const MAX_WINDOW_HEIGHT = 4320

export function toLoaderId(loader: string | null): LoaderId {
  return (loader as LoaderId | null) ?? 'vanilla'
}
