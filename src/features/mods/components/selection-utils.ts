import type { ModSearchResult, ModSource, ModVersion } from '@/types/mods'

export type SelectionMap = Record<
  string,
  { result: ModSearchResult; version: ModVersion }
>

export function selectionKey(source: ModSource, projectId: string) {
  return `${source}:${projectId}`
}
