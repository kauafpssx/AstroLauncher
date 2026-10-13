export type SeedMapDimension = 'overworld' | 'nether' | 'end'
export type SeedMapLayer = 'surface' | 'underground' | 'bottom'
export interface GenerateBiomeTileInput {
  seed: string
  mcVersion: string
  dimension: SeedMapDimension
  layer: SeedMapLayer
  originX: number
  originZ: number
  cellSizeBlocks: number
  gridWidth: number
  gridHeight: number
  includeHeights?: boolean
}
export interface BiomeTileResult {
  originX: number
  originZ: number
  cellSizeBlocks: number
  gridWidth: number
  gridHeight: number
  biomeIds: number[]
  heights?: number[]
}
export interface BiomePaletteEntry {
  id: number
  name: string
  label: string
  colorHex: string
  dimension: SeedMapDimension
}
export interface SpawnPointInput {
  seed: string
  mcVersion: string
}
export interface SpawnPoint {
  x: number
  z: number
}
export interface SlimeChunkInput {
  seed: string
  minChunkX: number
  minChunkZ: number
  maxChunkX: number
  maxChunkZ: number
}
export interface SlimeChunk {
  chunkX: number
  chunkZ: number
}
export interface ListStructuresInput {
  seed: string
  mcVersion: string
  dimension: SeedMapDimension
  structureType: string
  minX: number
  minZ: number
  maxX: number
  maxZ: number
}
export interface StructurePosition {
  x: number
  z: number
}
export interface ColumnInfoInput {
  seed: string
  mcVersion: string
  dimension: SeedMapDimension
  layer: SeedMapLayer
  x: number
  z: number
}
export interface ColumnInfo {
  biomeId: number
  y: number
}
export interface StructureVariantInput {
  seed: string
  mcVersion: string
  dimension: SeedMapDimension
  structureType: string
  x: number
  z: number
}
export interface StructureVariant {
  abandoned: boolean | null
  bastionType: string | null
  villageBiome: string | null
  ruinedPortalGiant: boolean | null
  ruinedPortalUnderground: boolean | null
  ruinedPortalAirPocket: boolean | null
  ruinedPortalBiome: string | null
  iglooHasBasement: boolean | null
  shipwreckBeached: boolean | null
  geodeCracked: boolean | null
  geodeSize: number | null
}
