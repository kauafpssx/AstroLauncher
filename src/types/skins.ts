export type SkinSortBy = 'popular-desc' | 'popular-asc'

export interface SkinPlayer {
  uuid: string
  username: string
}

export interface SkinSummary {
  hash: string
  skinUrl: string
  model: string
  playerCount: number
  firstSeenPlayer: SkinPlayer
}

export interface SkinDetail {
  hash: string
  skinUrl: string
  model: string
  playerCount: number
  oldestPlayer: SkinPlayer
  currentPlayers: SkinPlayer[]
}

export interface SearchSkinsInput {
  query: string
  page: number
  sortBy: SkinSortBy
}
