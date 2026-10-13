import { useCallback } from 'react'
import type { RefObject } from 'react'
import OlMap from 'ol/Map'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import LineString from 'ol/geom/LineString'
import Polygon from 'ol/geom/Polygon'
import VectorSource from 'ol/source/Vector'
import { SeedMapAPI } from '@/features/instances/services/seed-map.api'
import { STRUCTURE_LIST } from '@/data/structure-metadata'
import {
  RESOLUTION,
  SLIME_MAX_RESOLUTION,
  DEFAULT_CENTER,
  SLIME_BUCKET_SIZE,
  STRUCTURE_BUCKET_SIZE_BLOCKS,
  getStructureMaxResolution,
} from '@/features/instances/components/edit-instance/seed-map/lib/seed-map-geo'
import {
  TARGET_CROSSHAIR_STYLE,
  TARGET_LINE_STYLE,
} from '@/features/instances/components/edit-instance/seed-map/lib/map-styles'
import type { SeedMapDimension } from '@/types/seed-map'
interface UseSeedMapFetchersArgs {
  mapRef: RefObject<OlMap | null>
  slimeSourceRef: RefObject<VectorSource | null>
  showSlimeChunksRef: RefObject<boolean>
  seedRef: RefObject<string | null>
  dimensionRef: RefObject<SeedMapDimension>
  effectiveVersionRef: RefObject<string>
  fetchedSlimeChunksRef: RefObject<Set<string>>
  structureSourceRef: RefObject<VectorSource | null>
  fetchedStructuresRef: RefObject<Set<string>>
  enabledStructureIdsRef: RefObject<Set<string>>
  targetLineSourceRef: RefObject<VectorSource | null>
  targetedStructureIdRef: RefObject<string | null>
  searchOriginRef: RefObject<{
    x: number
    z: number
  } | null>
  pinnedTargetKeyRef: RefObject<string | null>
  strongholdCoveredBoundsRef: RefObject<{
    minX: number
    minZ: number
    maxX: number
    maxZ: number
  } | null>
}
export function useSeedMapFetchers({
  mapRef,
  slimeSourceRef,
  showSlimeChunksRef,
  seedRef,
  dimensionRef,
  effectiveVersionRef,
  fetchedSlimeChunksRef,
  structureSourceRef,
  fetchedStructuresRef,
  enabledStructureIdsRef,
  targetLineSourceRef,
  targetedStructureIdRef,
  searchOriginRef,
  pinnedTargetKeyRef,
  strongholdCoveredBoundsRef,
}: UseSeedMapFetchersArgs) {
  const fetchVisibleSlimeChunks = useCallback(() => {
    const map = mapRef.current
    const source = slimeSourceRef.current
    if (!map || !source) return
    if (
      !showSlimeChunksRef.current ||
      !seedRef.current ||
      dimensionRef.current !== 'overworld'
    )
      return
    const view = map.getView()
    const resolution = view.getResolution() ?? RESOLUTION
    if (resolution > SLIME_MAX_RESOLUTION) return
    const size = map.getSize()
    if (!size) return
    const extent = view.calculateExtent(size)
    const margin = 1.5
    const halfWC = ((extent[2] - extent[0]) / 2) * margin
    const halfHC = ((extent[3] - extent[1]) / 2) * margin
    const center = view.getCenter() ?? DEFAULT_CENTER
    const minCX = Math.floor((center[0] - halfWC) / 16)
    const maxCX = Math.floor((center[0] + halfWC) / 16)
    const minCZ = Math.floor((-center[1] - halfHC) / 16)
    const maxCZ = Math.floor((-center[1] + halfHC) / 16)
    const rangeX = maxCX - minCX + 1
    const rangeZ = maxCZ - minCZ + 1
    if (rangeX > 200 || rangeZ > 200) return
    const minBX = Math.floor(minCX / SLIME_BUCKET_SIZE)
    const maxBX = Math.floor(maxCX / SLIME_BUCKET_SIZE)
    const minBZ = Math.floor(minCZ / SLIME_BUCKET_SIZE)
    const maxBZ = Math.floor(maxCZ / SLIME_BUCKET_SIZE)
    const curSeed = seedRef.current
    const toFetch: Array<{
      minChunkX: number
      minChunkZ: number
      maxChunkX: number
      maxChunkZ: number
    }> = []
    for (let bz = minBZ; bz <= maxBZ; bz++) {
      for (let bx = minBX; bx <= maxBX; bx++) {
        const key = `${bx},${bz}`
        if (fetchedSlimeChunksRef.current.has(key)) continue
        fetchedSlimeChunksRef.current.add(key)
        toFetch.push({
          minChunkX: bx * SLIME_BUCKET_SIZE,
          minChunkZ: bz * SLIME_BUCKET_SIZE,
          maxChunkX: bx * SLIME_BUCKET_SIZE + SLIME_BUCKET_SIZE,
          maxChunkZ: bz * SLIME_BUCKET_SIZE + SLIME_BUCKET_SIZE,
        })
      }
    }
    if (toFetch.length === 0) return
    void Promise.allSettled(
      toFetch.map((t) =>
        SeedMapAPI.listSlimeChunks({ seed: curSeed, ...t }).then((chunks) => {
          for (const sc of chunks) {
            const x0 = sc.chunkX * 16
            const x1 = sc.chunkX * 16 + 16
            const z0 = sc.chunkZ * 16
            const z1 = sc.chunkZ * 16 + 16
            const poly = new Polygon([
              [
                [x0, -z0],
                [x1, -z0],
                [x1, -z1],
                [x0, -z1],
                [x0, -z0],
              ],
            ])
            const feature = new Feature({ geometry: poly })
            feature.set('chunkX', sc.chunkX)
            feature.set('chunkZ', sc.chunkZ)
            source.addFeature(feature)
          }
        }),
      ),
    )
  }, [])
  const updateTargetLine = useCallback(() => {
    const map = mapRef.current
    const lineSource = targetLineSourceRef.current
    const structureSource = structureSourceRef.current
    if (!map || !lineSource || !structureSource) return
    lineSource.clear()
    const targetId = targetedStructureIdRef.current
    const origin = searchOriginRef.current
    if (!targetId || !origin) {
      map.render()
      return
    }
    const centerX = origin.x
    const centerZ = origin.z
    const crosshairFeature = new Feature({
      geometry: new Point([centerX, -centerZ]),
    })
    crosshairFeature.setStyle(TARGET_CROSSHAIR_STYLE)
    lineSource.addFeature(crosshairFeature)
    const candidates = structureSource
      .getFeatures()
      .filter((f) => f.get('structureId') === targetId)
    let target = pinnedTargetKeyRef.current
      ? candidates.find(
          (f) => `${f.get('x')}:${f.get('z')}` === pinnedTargetKeyRef.current,
        )
      : undefined
    if (!target) {
      let bestDist = Infinity
      for (const f of candidates) {
        const x = f.get('x') as number
        const z = f.get('z') as number
        const dist = (x - centerX) ** 2 + (z - centerZ) ** 2
        if (dist < bestDist) {
          bestDist = dist
          target = f
        }
      }
    }
    if (target) {
      const tx = target.get('x') as number
      const tz = target.get('z') as number
      const lineFeature = new Feature({
        geometry: new LineString([
          [centerX, -centerZ],
          [tx, -tz],
        ]),
      })
      lineFeature.setStyle(TARGET_LINE_STYLE)
      lineSource.addFeature(lineFeature)
    }
    map.render()
  }, [])
  const fetchVisibleStructures = useCallback(() => {
    const map = mapRef.current
    const source = structureSourceRef.current
    if (!map || !source) return
    if (!seedRef.current) return
    const view = map.getView()
    const resolution = view.getResolution() ?? RESOLUTION
    const size = map.getSize()
    if (!size) return
    const extent = view.calculateExtent(size)
    const margin = 2
    const halfWC = ((extent[2] - extent[0]) / 2) * margin
    const halfHC = ((extent[3] - extent[1]) / 2) * margin
    const center = view.getCenter() ?? DEFAULT_CENTER
    const minCX = Math.floor((center[0] - halfWC) / 16)
    const maxCX = Math.floor((center[0] + halfWC) / 16)
    const minCZ = Math.floor((-center[1] - halfHC) / 16)
    const maxCZ = Math.floor((-center[1] + halfHC) / 16)
    const minBX = Math.floor(minCX / (STRUCTURE_BUCKET_SIZE_BLOCKS / 16))
    const maxBX = Math.floor(maxCX / (STRUCTURE_BUCKET_SIZE_BLOCKS / 16))
    const minBZ = Math.floor(minCZ / (STRUCTURE_BUCKET_SIZE_BLOCKS / 16))
    const maxBZ = Math.floor(maxCZ / (STRUCTURE_BUCKET_SIZE_BLOCKS / 16))
    const seed = seedRef.current
    const mcVersion = effectiveVersionRef.current
    const dim = dimensionRef.current
    const candidates: Array<{
      bucketKey: string
      structureId: string
      structureType: string
      minX: number
      minZ: number
      maxX: number
      maxZ: number
    }> = []
    const enabledIds = enabledStructureIdsRef.current
    for (const structure of STRUCTURE_LIST) {
      if (structure.dimension !== dim) continue
      if (!structure.cubiomesType) continue
      if (!enabledIds.has(structure.id)) continue
      if (resolution >= getStructureMaxResolution(structure)) continue
      for (let bz = minBZ; bz <= maxBZ; bz++) {
        for (let bx = minBX; bx <= maxBX; bx++) {
          const bucketKey = `${structure.id},${bx},${bz}`
          if (fetchedStructuresRef.current.has(bucketKey)) continue
          candidates.push({
            bucketKey,
            structureId: structure.id,
            structureType: structure.cubiomesType,
            minX: bx * STRUCTURE_BUCKET_SIZE_BLOCKS,
            minZ: bz * STRUCTURE_BUCKET_SIZE_BLOCKS,
            maxX: (bx + 1) * STRUCTURE_BUCKET_SIZE_BLOCKS,
            maxZ: (bz + 1) * STRUCTURE_BUCKET_SIZE_BLOCKS,
          })
        }
      }
    }
    if (candidates.length === 0) return
    const MAX_BUCKETS_PER_CALL = 256
    const toFetch = candidates.slice(0, MAX_BUCKETS_PER_CALL)
    for (const t of toFetch) fetchedStructuresRef.current.add(t.bucketKey)
    void Promise.allSettled(
      toFetch.map((t) =>
        SeedMapAPI.listStructures({
          seed,
          mcVersion,
          dimension: dim,
          structureType: t.structureType,
          minX: t.minX,
          minZ: t.minZ,
          maxX: t.maxX,
          maxZ: t.maxZ,
        }).then((positions) => {
          for (const pos of positions) {
            const feature = new Feature({
              geometry: new Point([pos.x, -pos.z]),
            })
            feature.set('structureId', t.structureId)
            feature.set('x', pos.x)
            feature.set('z', pos.z)
            source.addFeature(feature)
          }
          updateTargetLine()
          map.render()
        }),
      ),
    )
  }, [])
  const fetchStrongholds = useCallback(() => {
    const map = mapRef.current
    const source = structureSourceRef.current
    if (!map || !source) return
    if (!seedRef.current) return
    if (dimensionRef.current !== 'overworld') return
    const view = map.getView()
    const size = map.getSize()
    if (!size) return
    const extent = view.calculateExtent(size)
    const margin = 2
    const halfW = ((extent[2] - extent[0]) / 2) * margin
    const halfH = ((extent[3] - extent[1]) / 2) * margin
    const center = view.getCenter() ?? DEFAULT_CENTER
    const minX = Math.round(center[0] - halfW)
    const maxX = Math.round(center[0] + halfW)
    const minZ = Math.round(-center[1] - halfH)
    const maxZ = Math.round(-center[1] + halfH)
    const covered = strongholdCoveredBoundsRef.current
    if (
      covered &&
      minX >= covered.minX &&
      maxX <= covered.maxX &&
      minZ >= covered.minZ &&
      maxZ <= covered.maxZ
    ) {
      return
    }
    const seed = seedRef.current
    const mcVersion = effectiveVersionRef.current
    strongholdCoveredBoundsRef.current = { minX, minZ, maxX, maxZ }
    SeedMapAPI.listStrongholds({
      seed,
      mcVersion,
      dimension: 'overworld',
      structureType: 'stronghold',
      minX,
      minZ,
      maxX,
      maxZ,
    })
      .then((positions) => {
        for (const f of source.getFeatures()) {
          if (f.get('structureId') === 'stronghold') source.removeFeature(f)
        }
        for (const pos of positions) {
          const feature = new Feature({ geometry: new Point([pos.x, -pos.z]) })
          feature.set('structureId', 'stronghold')
          feature.set('x', pos.x)
          feature.set('z', pos.z)
          source.addFeature(feature)
        }
        updateTargetLine()
        map.render()
      })
      .catch(() => {
        strongholdCoveredBoundsRef.current = null
      })
  }, [])
  return {
    fetchVisibleSlimeChunks,
    updateTargetLine,
    fetchVisibleStructures,
    fetchStrongholds,
  }
}
