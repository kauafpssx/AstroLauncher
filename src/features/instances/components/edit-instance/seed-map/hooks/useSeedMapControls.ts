import { useCallback } from 'react'
import type OlMap from 'ol/Map'
import type Overlay from 'ol/Overlay'
import { STRUCTURE_BY_ID } from '@/features/instances/components/edit-instance/seed-map/components/seed-map-shared'
import {
  DEFAULT_CENTER,
  DEFAULT_RESOLUTION,
  MAX_RESOLUTION,
  RESOLUTION,
  SLIME_MAX_RESOLUTION,
  getStructureMaxResolution,
  searchNearestStructures,
} from '@/features/instances/components/edit-instance/seed-map/lib/seed-map-geo'
import { BIOME_METADATA, type BiomeCategory } from '@/data/biome-metadata'
import type { SeedMapDimension } from '@/types/seed-map'
import type { BiomePaletteEntry } from '@/types/seed-map'
interface SeedMapControlsParams {
  mapRef: { current: OlMap | null }
  spawnPointRef: { current: [number, number] | null }
  placeCustomMarkerRef: { current: ((x: number, z: number) => void) | null }
  structureOverlayRef: { current: Overlay | null }
  setStructurePopup: React.Dispatch<
    React.SetStateAction<{
      structureId: string
      x: number
      z: number
      y: number | null
      completed: boolean
    } | null>
  >
  pendingPanRef: {
    current: { x: number; z: number; placeMarker: boolean } | null
  }
  seedRef: { current: string | null }
  effectiveVersionRef: { current: string }
  dimensionRef: { current: SeedMapDimension }
  enabledStructureIdsRef: { current: Set<string> }
  pinnedTargetKeyRef: { current: string | null }
  searchOriginRef: { current: { x: number; z: number } | null }
  targetSearchTokenRef: { current: number }
  targetResultsRef: { current: Array<{ x: number; z: number }> }
  targetedStructureIdRef: { current: string | null }
  setTargetResultIndex: React.Dispatch<React.SetStateAction<number>>
  setHighlightedBiomeIds: React.Dispatch<React.SetStateAction<Set<number>>>
  setEnabledStructureIds: React.Dispatch<React.SetStateAction<Set<string>>>
  setShowSlimeChunks: React.Dispatch<React.SetStateAction<boolean>>
  setDimension: React.Dispatch<React.SetStateAction<SeedMapDimension>>
  setCustomMarkerPopup: React.Dispatch<
    React.SetStateAction<{
      x: number
      y: number
      z: number
      biomeName: string | null
      biomeColor: string | null
    } | null>
  >
  setActiveBiomeCategories: React.Dispatch<
    React.SetStateAction<Set<BiomeCategory>>
  >
  setSearchOrigin: React.Dispatch<
    React.SetStateAction<{ x: number; z: number } | null>
  >
  setTargetedStructureId: React.Dispatch<React.SetStateAction<string | null>>
  setTargetResults: React.Dispatch<
    React.SetStateAction<Array<{ x: number; z: number }>>
  >
  setTargetSearching: React.Dispatch<React.SetStateAction<boolean>>
  setTargetSearchedRadius: React.Dispatch<React.SetStateAction<number>>
  setTargetResultsListOpen: React.Dispatch<React.SetStateAction<boolean>>
  setStructureSearchOpen: React.Dispatch<React.SetStateAction<boolean>>
  gotoX: string
  gotoZ: string
  dimensionPalette: BiomePaletteEntry[]
}
export function useSeedMapControls({
  mapRef,
  spawnPointRef,
  placeCustomMarkerRef,
  structureOverlayRef,
  setStructurePopup,
  pendingPanRef,
  seedRef,
  effectiveVersionRef,
  dimensionRef,
  enabledStructureIdsRef,
  pinnedTargetKeyRef,
  searchOriginRef,
  targetSearchTokenRef,
  targetResultsRef,
  targetedStructureIdRef,
  setTargetResultIndex,
  setHighlightedBiomeIds,
  setEnabledStructureIds,
  setShowSlimeChunks,
  setDimension,
  setCustomMarkerPopup,
  setActiveBiomeCategories,
  setSearchOrigin,
  setTargetedStructureId,
  setTargetResults,
  setTargetSearching,
  setTargetSearchedRadius,
  setTargetResultsListOpen,
  setStructureSearchOpen,
  gotoX,
  gotoZ,
  dimensionPalette,
}: SeedMapControlsParams) {
  const handlePrevTargetResult = useCallback(() => {
    setTargetResultIndex((i) => {
      const n = targetResultsRef.current.length
      return n ? (i - 1 + n) % n : 0
    })
  }, [])
  const handleNextTargetResult = useCallback(() => {
    setTargetResultIndex((i) => {
      const n = targetResultsRef.current.length
      return n ? (i + 1) % n : 0
    })
  }, [])
  const handleToggleBiomeHighlight = useCallback(
    (id: number, checked: boolean) => {
      setHighlightedBiomeIds((prev) => {
        const next = new Set(prev)
        if (checked) next.add(id)
        else next.delete(id)
        return next
      })
    },
    [],
  )
  const handleToggleStructure = useCallback((id: string, checked: boolean) => {
    setEnabledStructureIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
    if (checked) {
      const structure = STRUCTURE_BY_ID.get(id)
      const view = mapRef.current?.getView()
      if (structure && view) {
        const needed = getStructureMaxResolution(structure)
        const current = view.getResolution() ?? RESOLUTION
        if (current >= needed) {
          view.animate({ resolution: needed * 0.9, duration: 300 })
        }
      }
    }
  }, [])
  const handleToggleSlimeChunks = useCallback((checked: boolean) => {
    setShowSlimeChunks(checked)
    if (checked) {
      const view = mapRef.current?.getView()
      const current = view?.getResolution() ?? RESOLUTION
      if (view && current >= SLIME_MAX_RESOLUTION) {
        // 1.41 (0.70x) é o degrau de VIEW_RESOLUTIONS logo abaixo de
        // SLIME_MAX_RESOLUTION — animar por multiplicador (ex.: * 0.9) pousa
        // numa resolução contínua fora da grade discreta que a view usa,
        // o que pode ainda ficar acima do limiar real de visibilidade.
        view.animate({ resolution: 1.41, duration: 300 })
      }
    }
  }, [])
  const handleSelectStructureSearch = useCallback(
    (id: string) => {
      setStructureSearchOpen(false)
      pinnedTargetKeyRef.current = null
      const center = mapRef.current?.getView().getCenter() ?? DEFAULT_CENTER
      const origin = { x: center[0], z: -center[1] }
      searchOriginRef.current = origin
      setSearchOrigin(origin)
      setTargetedStructureId(id)
      setTargetResults([])
      setTargetResultIndex(0)
      const token = ++targetSearchTokenRef.current
      const structure = STRUCTURE_BY_ID.get(id)
      if (structure && seedRef.current) {
        setTargetSearching(true)
        searchNearestStructures(
          origin,
          structure,
          seedRef.current,
          effectiveVersionRef.current,
          dimensionRef.current as SeedMapDimension,
          token,
          targetSearchTokenRef,
          (results, radius) => {
            if (targetSearchTokenRef.current !== token) return
            setTargetResults(results)
            setTargetResultIndex(0)
            setTargetSearchedRadius(radius)
          },
        ).finally(() => {
          if (targetSearchTokenRef.current === token) setTargetSearching(false)
        })
      }
      if (!enabledStructureIdsRef.current.has(id)) {
        handleToggleStructure(id, true)
      } else {
        const view = mapRef.current?.getView()
        if (structure && view) {
          const needed = getStructureMaxResolution(structure)
          const current = view.getResolution() ?? RESOLUTION
          if (current >= needed) {
            view.animate({ resolution: needed * 0.9, duration: 300 })
          }
        }
      }
    },
    [handleToggleStructure],
  )
  const handleClearStructureSearch = useCallback(() => {
    const id = targetedStructureIdRef.current
    pinnedTargetKeyRef.current = null
    searchOriginRef.current = null
    setSearchOrigin(null)
    setTargetedStructureId(null)
    setTargetResults([])
    setTargetResultIndex(0)
    targetSearchTokenRef.current++
    setTargetSearching(false)
    setTargetResultsListOpen(false)
    setStructurePopup(null)
    structureOverlayRef.current?.setPosition(undefined)
    if (id) handleToggleStructure(id, false)
  }, [handleToggleStructure])
  const handleGoToEquivalentDimension = useCallback(
    (targetDimension: SeedMapDimension, x: number, z: number) => {
      pendingPanRef.current = { x, z, placeMarker: true }
      setDimension(targetDimension)
      setCustomMarkerPopup(null)
    },
    [],
  )
  const handleCategoryFilterChange = useCallback(
    (next: Set<BiomeCategory>) => {
      setActiveBiomeCategories((prev) => {
        const added = new Set(next)
        const removed = new Set(prev)
        added.forEach((cat) => {
          if (prev.has(cat)) added.delete(cat)
        })
        removed.forEach((cat) => {
          if (next.has(cat)) removed.delete(cat)
        })
        setHighlightedBiomeIds((prevHighlighted) => {
          const newHighlighted = new Set(prevHighlighted)
          dimensionPalette.forEach((entry) => {
            const category = BIOME_METADATA[entry.name]?.category
            if (!category) return
            if (added.has(category)) {
              newHighlighted.add(entry.id)
            } else if (removed.has(category)) {
              newHighlighted.delete(entry.id)
            }
          })
          return newHighlighted
        })
        return next
      })
    },
    [dimensionPalette],
  )
  const handleGo = useCallback(() => {
    const x = Number(gotoX)
    const z = Number(gotoZ)
    if (!Number.isFinite(x) || !Number.isFinite(z)) return
    mapRef.current?.getView().setCenter([x, -z])
    placeCustomMarkerRef.current?.(x, z)
  }, [gotoX, gotoZ])
  const handleZoomIn = useCallback(() => {
    const view = mapRef.current?.getView()
    if (!view) return
    const r = view.getResolution() ?? RESOLUTION
    view.animate({ resolution: Math.max(RESOLUTION, r / 1.4), duration: 200 })
  }, [])
  const handleZoomOut = useCallback(() => {
    const view = mapRef.current?.getView()
    if (!view) return
    const r = view.getResolution() ?? RESOLUTION
    view.animate({
      resolution: Math.min(MAX_RESOLUTION, r * 1.4),
      duration: 200,
    })
  }, [])
  const handleReset = useCallback(() => {
    const view = mapRef.current?.getView()
    if (!view) return
    view.setCenter(spawnPointRef.current ?? DEFAULT_CENTER)
    view.setResolution(DEFAULT_RESOLUTION)
  }, [])
  return {
    handlePrevTargetResult,
    handleNextTargetResult,
    handleToggleBiomeHighlight,
    handleToggleStructure,
    handleToggleSlimeChunks,
    handleSelectStructureSearch,
    handleClearStructureSearch,
    handleGoToEquivalentDimension,
    handleCategoryFilterChange,
    handleGo,
    handleZoomIn,
    handleZoomOut,
    handleReset,
  }
}
