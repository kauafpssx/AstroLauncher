export type SkinSource = 'playermc' | 'mcstat'
export type PlayerMcSortBy = 'popular-desc' | 'popular-asc'
export type McstatSortBy = 'recent' | 'popular' | 'trending'
export type SkinSortBy = PlayerMcSortBy | McstatSortBy
export type SkinModel = 'classic' | 'slim'

interface SkinPlayer {
  uuid: string
  username: string
}

export interface SkinSummary {
  id: string
  source: SkinSource
  skinUrl: string
  model: string
  playerCount: number
  firstSeenPlayer: SkinPlayer
}

export interface SkinDetail {
  id: string
  source: SkinSource
  skinUrl: string
  model: string
  playerCount: number
  oldestPlayer: SkinPlayer
  currentPlayers: SkinPlayer[]
}

export interface SearchSkinsInput {
  source: SkinSource
  query: string
  page: number
  sortBy: SkinSortBy
  /** MCStat only: Classic/Slim skin model filter. */
  model?: SkinModel | null
}
