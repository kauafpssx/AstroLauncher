import Projection from 'ol/proj/Projection'
import TileGrid from 'ol/tilegrid/TileGrid'
import { SeedMapAPI } from '@/features/instances/services/seed-map.api'
import { MAX_TARGET_RESULTS } from '@/features/instances/components/edit-instance/seed-map/components/seed-map-shared'
import type { SeedMapDimension } from '@/types/seed-map'
import type { StructureMetadata } from '@/data/structure-metadata'
const MC_EXTENT = 30000000
export const TILE_SIZE = 128
const TILE_RESOLUTIONS = [64, 16, 4]
export const SLIME_BUCKET_SIZE = 64
export const STRUCTURE_BUCKET_SIZE_BLOCKS = 512
const DEFAULT_STRUCTURE_MIN_ZOOM = 0.15
export function getStructureMaxResolution(structure: {
  minZoom?: number
}): number {
  return 1 / (structure.minZoom ?? DEFAULT_STRUCTURE_MIN_ZOOM)
}
const MAX_TARGET_SEARCH_RADIUS_BLOCKS = 65536
// OpenLayers trata layer.maxResolution como limite EXCLUSIVO (visível só
// quando resolution < maxResolution) — usar exatamente 2 escondia a camada
// bem no degrau de resolução 2 (0.5x), pulando pro próximo degrau discreto
// (1.41, 0.70x). Levemente acima de 2 garante que o degrau 2 fique visível.
export const SLIME_MAX_RESOLUTION = 2.01
export const VIEW_RESOLUTIONS = [
  64, 45.25, 32, 22.63, 16, 11.31, 8, 5.66, 4, 2.83, 2, 1.41, 1, 0.5, 0.25,
  0.125,
]
export const RESOLUTION = VIEW_RESOLUTIONS[VIEW_RESOLUTIONS.length - 1]
export const MAX_RESOLUTION = VIEW_RESOLUTIONS[0]
export const DEFAULT_RESOLUTION = 4
export const mcProjection = new Projection({
  code: 'minecraft-pixels',
  units: 'pixels',
  extent: [-MC_EXTENT, -MC_EXTENT, MC_EXTENT, MC_EXTENT],
})
export const tileGrid = new TileGrid({
  extent: [-MC_EXTENT, -MC_EXTENT, MC_EXTENT, MC_EXTENT],
  origin: [-MC_EXTENT, MC_EXTENT],
  resolutions: TILE_RESOLUTIONS,
  tileSize: TILE_SIZE,
})
export const DEFAULT_CENTER: [number, number] = [0, 0]
export async function searchNearestStructures(
  origin: { x: number; z: number },
  structure: StructureMetadata,
  seed: string,
  mcVersion: string,
  dimension: SeedMapDimension,
  token: number,
  tokenRef: { current: number },
  onUpdate: (results: Array<{ x: number; z: number }>, radius: number) => void,
) {
  if (!structure.cubiomesType && structure.id !== 'stronghold') return
  const seen = new Set<string>()
  const results: Array<{ x: number; z: number }> = []
  let radius = 1024
  while (radius <= MAX_TARGET_SEARCH_RADIUS_BLOCKS) {
    if (tokenRef.current !== token) return
    const bounds = {
      minX: Math.round(origin.x - radius),
      minZ: Math.round(origin.z - radius),
      maxX: Math.round(origin.x + radius),
      maxZ: Math.round(origin.z + radius),
    }
    let positions: Array<{ x: number; z: number }>
    try {
      if (structure.id === 'stronghold') {
        positions = await SeedMapAPI.listStrongholds({
          seed,
          mcVersion,
          dimension,
          structureType: 'stronghold',
          ...bounds,
        })
      } else {
        positions = await SeedMapAPI.listStructures({
          seed,
          mcVersion,
          dimension,
          structureType: structure.cubiomesType!,
          ...bounds,
        })
      }
    } catch {
      return
    }
    if (tokenRef.current !== token) return
    for (const p of positions) {
      const key = `${p.x}:${p.z}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push(p)
      }
    }
    results.sort(
      (a, b) =>
        Math.hypot(a.x - origin.x, a.z - origin.z) -
        Math.hypot(b.x - origin.x, b.z - origin.z),
    )
    onUpdate(results.slice(0, MAX_TARGET_RESULTS), radius)
    if (results.length >= MAX_TARGET_RESULTS) return
    radius *= 2
  }
}
