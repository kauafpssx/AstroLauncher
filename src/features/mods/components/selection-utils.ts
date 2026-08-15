import type { ModSearchResult, ModSource, ModVersion } from '@/types/mods'

export type SelectionMap = Record<
  string,
  { result: ModSearchResult; version: ModVersion }
>

export function selectionKey(source: ModSource, projectId: string) {
  return `${source}:${projectId}`
}

/** Normalizes a mod name for cross-platform matching (Modrinth vs
 * CurseForge use different project IDs for the same mod). */
export function normalizeName(name: string) {
  return name.trim().toLowerCase()
}
