import type { ModSearchResult, ModVersion } from '@/types/mods'

export interface ReviewEntry {
  key: string
  result: ModSearchResult
  version: ModVersion
  isDependency: boolean
}

export type EntryStatus = 'pending' | 'installing' | 'done' | 'failed'
