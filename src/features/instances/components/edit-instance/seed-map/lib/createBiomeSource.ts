import type { RefObject } from 'react'
import DataTileSource from 'ol/source/DataTile'
import TileState from 'ol/TileState'
import { SeedMapAPI } from '@/features/instances/services/seed-map.api'
import type { SeedMapDimension, SeedMapLayer } from '@/types/seed-map'
import { TILE_SIZE, mcProjection, tileGrid } from './seed-map-geo'
export function createBiomeSourceImpl({
  seed,
  effectiveVersion,
  dimension,
  mapLayer,
  terrainModeRef,
  biomeRgbRef,
  biomeRgbDimmedRef,
  biomeRgbHighlightRef,
  highlightedBiomeIdsRef,
}: {
  seed: string | null
  effectiveVersion: string
  dimension: SeedMapDimension
  mapLayer: SeedMapLayer
  terrainModeRef: RefObject<boolean>
  biomeRgbRef: RefObject<Uint8Array>
  biomeRgbDimmedRef: RefObject<Uint8Array>
  biomeRgbHighlightRef: RefObject<Uint8Array>
  highlightedBiomeIdsRef: RefObject<Set<number>>
}) {
  const biomeSource = new DataTileSource({
    loader: (z, x, y, opts) => {
      if (!seed) return new Uint8Array(TILE_SIZE * TILE_SIZE * 4)
      if (opts.signal?.aborted) return new Uint8Array(0)
      const extent = tileGrid.getTileCoordExtent([z, x, y])
      const originX = extent[0]
      const originZ = -extent[3]
      const cellSizeBlocks = tileGrid.getResolution(z)
      const includeHeights =
        terrainModeRef.current &&
        dimension === 'overworld' &&
        mapLayer === 'surface'
      return SeedMapAPI.generateBiomeTile({
        seed,
        mcVersion: effectiveVersion,
        dimension,
        layer: mapLayer,
        originX,
        originZ,
        cellSizeBlocks,
        gridWidth: TILE_SIZE,
        gridHeight: TILE_SIZE,
        includeHeights,
      }).then((result) => {
        if (opts.signal?.aborted) throw new Error('aborted')
        const data = new Uint8Array(TILE_SIZE * TILE_SIZE * 4)
        const rgb = biomeRgbRef.current
        const rgbDimmed = biomeRgbDimmedRef.current
        const rgbHighlight = biomeRgbHighlightRef.current
        const highlighted = highlightedBiomeIdsRef.current
        const hasHighlight = highlighted.size > 0
        const len = Math.min(result.biomeIds.length, TILE_SIZE * TILE_SIZE)
        const heights = result.heights
        const hasHeights = !!heights && heights.length === len
        for (let i = 0; i < len; i++) {
          const biomeId = result.biomeIds[i]
          const off = i * 4
          const rgbOff = biomeId * 3
          const source = !hasHighlight
            ? rgb
            : highlighted.has(biomeId)
              ? rgbHighlight
              : rgbDimmed
          let shade = 1
          if (hasHeights) {
            const x = i % TILE_SIZE
            const yRow = (i / TILE_SIZE) | 0
            const left = x > 0 ? heights![i - 1] : heights![i]
            const right = x < TILE_SIZE - 1 ? heights![i + 1] : heights![i]
            const up = yRow > 0 ? heights![i - TILE_SIZE] : heights![i]
            const down =
              yRow < TILE_SIZE - 1 ? heights![i + TILE_SIZE] : heights![i]
            const slope = (right - left - (down - up)) * 0.5
            shade = Math.min(1.5, Math.max(0.5, 1 + slope * 0.035))
          }
          data[off] = Math.min(255, source[rgbOff] * shade)
          data[off + 1] = Math.min(255, source[rgbOff + 1] * shade)
          data[off + 2] = Math.min(255, source[rgbOff + 2] * shade)
          data[off + 3] = 255
        }
        return data
      })
    },
    projection: mcProjection,
    tileGrid,
    tileSize: TILE_SIZE,
    transition: 200,
    key: `${seed}|${effectiveVersion}|${dimension}|${mapLayer}`,
  })
  const tileRetryCount = new Map<string, number>()
  biomeSource.on(
    'tileloaderror',
    (evt: {
      tile: {
        getKey: () => string
        setState: (state: number) => void
      }
    }) => {
      const key = evt.tile.getKey()
      const retries = (tileRetryCount.get(key) || 0) + 1
      tileRetryCount.set(key, retries)
      if (retries < 3) {
        evt.tile.setState(TileState.IDLE)
      } else {
        evt.tile.setState(TileState.ERROR)
        tileRetryCount.delete(key)
      }
    },
  )
  return biomeSource
}
