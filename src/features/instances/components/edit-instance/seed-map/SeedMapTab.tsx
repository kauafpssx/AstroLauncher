import { Map as MapIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import OlMap from 'ol/Map'
import type DataTileSource from 'ol/source/DataTile'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import {
  Style as OlStyle,
  Fill as OlFill,
  Stroke as OlStroke,
  Circle as OlCircle,
} from 'ol/style'
import Overlay from 'ol/Overlay'
import 'ol/ol.css'
import { EmptyState } from '@/components/common/EmptyState'
import { TabHeader } from '@/components/common/TabHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { SeedMapAPI } from '@/features/instances/services/seed-map.api'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import type {
  BiomePaletteEntry,
  SeedMapDimension,
  SeedMapLayer,
} from '@/types/seed-map'
import type { WorldDTO } from '@/types/world'
import {
  BIOME_CATEGORY_LABELS_PT,
  BIOME_METADATA,
  isBiomeAvailableInVersion,
  type BiomeCategory,
} from '@/data/biome-metadata'
import { STRUCTURE_LIST } from './structure-metadata'
import { CustomMarkerPopupContent } from '@/features/instances/components/edit-instance/seed-map/components/CustomMarkerPopupContent'
import { SeedMapControlsRow } from '@/features/instances/components/edit-instance/seed-map/components/SeedMapControlsRow'
import { SeedMapLegendPanel } from '@/features/instances/components/edit-instance/seed-map/components/SeedMapLegendPanel'
import { StructurePopupContent } from '@/features/instances/components/edit-instance/seed-map/components/StructurePopupContent'
import { MapStatusOverlay } from '@/features/instances/components/edit-instance/seed-map/components/MapStatusOverlay'
import { MapToolsOverlay } from '@/features/instances/components/edit-instance/seed-map/components/MapToolsOverlay'
import { StructureSearchDialog } from '@/features/instances/components/edit-instance/seed-map/components/StructureSearchDialog'
import { TargetResultsNavigator } from '@/features/instances/components/edit-instance/seed-map/components/TargetResultsNavigator'
import { useSeedMapFetchers } from '@/features/instances/components/edit-instance/seed-map/hooks/useSeedMapFetchers'
import { useSeedMapControls } from '@/features/instances/components/edit-instance/seed-map/hooks/useSeedMapControls'
import { useSeedMapInstance } from '@/features/instances/components/edit-instance/seed-map/hooks/useSeedMapInstance'
import { createBiomeSourceImpl } from '@/features/instances/components/edit-instance/seed-map/lib/createBiomeSource'
import {
  DIM_FACTOR,
  DIM_GRAY,
  HIGHLIGHT_DARKEN_FACTOR,
  getStructureIconSizePx,
} from '@/features/instances/components/edit-instance/seed-map/lib/map-styles'
import {
  DEFAULT_RESOLUTION,
  RESOLUTION,
} from '@/features/instances/components/edit-instance/seed-map/lib/seed-map-geo'
import {
  SLIME_CHUNK_POPUP_ID,
  getStructurePopupMeta,
} from '@/features/instances/components/edit-instance/seed-map/lib/seed-map-popups'
import {
  loadStructureCompleted,
  persistStructureCompleted,
} from '@/features/instances/components/edit-instance/seed-map/lib/structure-completion'
const BIOME_CATEGORY_ORDER = Object.keys(
  BIOME_CATEGORY_LABELS_PT,
) as BiomeCategory[]
function getBiomeDisplayName(entry: BiomePaletteEntry): string {
  return BIOME_METADATA[entry.name]?.labelPt ?? entry.label
}
interface SeedMapTabProps {
  instanceId: string
  mcVersion: string
}
const HIDDEN_BIOME_NAMES = new Set(['the_void'])
export function SeedMapTab({ instanceId, mcVersion }: SeedMapTabProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const [worlds, setWorlds] = useState<WorldDTO[]>([])
  const [selectedWorldName, setSelectedWorldName] = useState<string | null>(
    null,
  )
  const [isLoadingWorlds, setIsLoadingWorlds] = useState(true)
  const [highlightedBiomeIds, setHighlightedBiomeIds] = useState<Set<number>>(
    () => new Set(),
  )
  const [showSpawn, setShowSpawn] = useState(true)
  const [showSlimeChunks, setShowSlimeChunks] = useState(false)
  const [enabledStructureIds, setEnabledStructureIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [dimension, setDimension] = useState<SeedMapDimension>('overworld')
  const [mapLayer, setMapLayer] = useState<SeedMapLayer>('surface')
  const [terrainMode, setTerrainMode] = useState(false)
  const terrainModeRef = useRef(terrainMode)
  useEffect(() => {
    terrainModeRef.current = terrainMode
  }, [terrainMode])
  const [versionOverride, setVersionOverride] = useState('')
  const [gotoX, setGotoX] = useState('')
  const [gotoZ, setGotoZ] = useState('')
  const [biomeSearch, setBiomeSearch] = useState('')
  const [activeBiomeCategories, setActiveBiomeCategories] = useState<
    Set<BiomeCategory>
  >(new Set())
  const [palette, setPalette] = useState<BiomePaletteEntry[]>([])
  const [paletteError, setPaletteError] = useState<{
    message: string
    version: string
  } | null>(null)
  const mapRef = useRef<OlMap | null>(null)
  const biomeLayerRef = useRef<WebGLTileLayer | null>(null)
  const biomeSourceRef = useRef<DataTileSource | null>(null)
  const spawnLayerRef = useRef<VectorLayer | null>(null)
  const spawnSourceRef = useRef<VectorSource | null>(null)
  const spawnPointRef = useRef<[number, number] | null>(null)
  const slimeLayerRef = useRef<VectorLayer | null>(null)
  const slimeSourceRef = useRef<VectorSource | null>(null)
  const paletteRef = useRef(new Map<number, string>())
  const structureLayerRef = useRef<VectorLayer | null>(null)
  const structureSourceRef = useRef<VectorSource | null>(null)
  const fetchedStructuresRef = useRef<Set<string>>(new Set())
  const [structurePopupEl] = useState(() => document.createElement('div'))
  const structureOverlayRef = useRef<Overlay | null>(null)
  const customMarkerSourceRef = useRef<VectorSource | null>(null)
  const customMarkerLayerRef = useRef<VectorLayer | null>(null)
  const customMarkerOverlayRef = useRef<Overlay | null>(null)
  const [customMarkerPopupEl] = useState(() => document.createElement('div'))
  const [customMarkerPopup, setCustomMarkerPopup] = useState<{
    x: number
    y: number
    z: number
    biomeName: string | null
    biomeColor: string | null
  } | null>(null)
  const [customMarkerDetailsOpen, setCustomMarkerDetailsOpen] = useState(false)
  const pendingPanRef = useRef<{
    x: number
    z: number
    placeMarker: boolean
  } | null>(null)
  const [structuresHiddenByZoom, setStructuresHiddenByZoom] = useState(false)
  const [mapResolution, setMapResolution] = useState(DEFAULT_RESOLUTION)
  const [structurePopup, setStructurePopup] = useState<{
    structureId: string
    x: number
    z: number
    completed: boolean
  } | null>(null)
  const structureCompletedMap = useRef(new Map<string, boolean>())
  const [coordsCopied, setCoordsCopied] = useState(false)
  const biomeRgbRef = useRef(new Uint8Array(256 * 3))
  const biomeRgbDimmedRef = useRef(new Uint8Array(256 * 3))
  const biomeRgbHighlightRef = useRef(new Uint8Array(256 * 3))
  const highlightedBiomeIdsRef = useRef<Set<number>>(highlightedBiomeIds)
  const fetchedSlimeChunksRef = useRef<Set<string>>(new Set())
  const showSlimeChunksRef = useRef(showSlimeChunks)
  const [hoverInfo, setHoverInfo] = useState<{
    x: number
    z: number
    y: number | null
    biomeName: string | null
    biomeColor: string | null
  } | null>(null)
  const hoverRequestIdRef = useRef(0)
  const hoverLastFetchedRef = useRef<{
    x: number
    z: number
  } | null>(null)
  const mapLayerRef = useRef(mapLayer)
  const selectedWorld = worlds.find((w) => w.name === selectedWorldName)
  const seed = selectedWorld?.seed != null ? String(selectedWorld.seed) : null
  const effectiveVersion = versionOverride.trim() || mcVersion
  const seedRef = useRef(seed)
  const dimensionRef = useRef(dimension)
  const effectiveVersionRef = useRef(effectiveVersion)
  const dimensionPalette = useMemo(
    () =>
      palette.filter(
        (entry) =>
          entry.dimension === dimension &&
          !HIDDEN_BIOME_NAMES.has(entry.name) &&
          BIOME_METADATA[entry.name]?.visible !== false &&
          isBiomeAvailableInVersion(
            BIOME_METADATA[entry.name]?.added ?? 'desconhecida',
            effectiveVersion,
          ),
      ),
    [palette, dimension, effectiveVersion],
  )
  const structuresForDimension = useMemo(
    () => STRUCTURE_LIST.filter((s) => s.dimension === dimension),
    [dimension],
  )
  const visiblePalette = useMemo(() => {
    const q = biomeSearch.trim().toLowerCase()
    return dimensionPalette.filter((entry) => {
      if (q && !getBiomeDisplayName(entry).toLowerCase().includes(q)) {
        return false
      }
      if (activeBiomeCategories.size > 0) {
        const category = BIOME_METADATA[entry.name]?.category
        if (!category || !activeBiomeCategories.has(category)) return false
      }
      return true
    })
  }, [dimensionPalette, biomeSearch, activeBiomeCategories])
  const presentBiomeCategories = useMemo(() => {
    const found = new Set<BiomeCategory>()
    for (const entry of dimensionPalette) {
      const category = BIOME_METADATA[entry.name]?.category
      if (category) found.add(category)
    }
    return BIOME_CATEGORY_ORDER.filter((c) => found.has(c))
  }, [dimensionPalette])
  const categorizedPalette = useMemo(() => {
    const buckets = new Map<BiomeCategory, BiomePaletteEntry[]>()
    for (const entry of visiblePalette) {
      const category = BIOME_METADATA[entry.name]?.category ?? 'legacy'
      const bucket = buckets.get(category) ?? []
      bucket.push(entry)
      buckets.set(category, bucket)
    }
    return BIOME_CATEGORY_ORDER.filter((c) => buckets.has(c)).map(
      (category) => ({ category, entries: buckets.get(category)! }),
    )
  }, [visiblePalette])
  useEffect(() => {
    let cancelled = false
    InstanceWorkspaceAPI.listWorlds(instanceId)
      .then((data) => {
        if (cancelled) return
        setWorlds(data)
        if (data.length > 0) {
          const sorted = [...data].sort((a, b) => {
            if (!a.lastModified) return 1
            if (!b.lastModified) return -1
            return (
              new Date(b.lastModified).getTime() -
              new Date(a.lastModified).getTime()
            )
          })
          setSelectedWorldName(sorted[0].name)
        }
      })
      .catch((err) => {
        if (!cancelled) toast.error(`Falha ao listar mundos: ${String(err)}`)
      })
      .finally(() => !cancelled && setIsLoadingWorlds(false))
    return () => {
      cancelled = true
    }
  }, [instanceId])
  useEffect(() => {
    let cancelled = false
    SeedMapAPI.listBiomePalette(effectiveVersion)
      .then((entries) => {
        if (cancelled) return
        setPaletteError(null)
        setPalette(entries)
        const colorMap = new Map<number, string>()
        const rgb = new Uint8Array(256 * 3)
        const rgbDimmed = new Uint8Array(256 * 3)
        const rgbHighlight = new Uint8Array(256 * 3)
        for (const e of entries) {
          colorMap.set(e.id, e.colorHex)
          const h = e.colorHex.replace('#', '')
          const idx = e.id * 3
          const r = parseInt(h.substring(0, 2), 16)
          const g = parseInt(h.substring(2, 4), 16)
          const b = parseInt(h.substring(4, 6), 16)
          rgb[idx] = r
          rgb[idx + 1] = g
          rgb[idx + 2] = b
          rgbDimmed[idx] = Math.round(r + (DIM_GRAY - r) * DIM_FACTOR)
          rgbDimmed[idx + 1] = Math.round(g + (DIM_GRAY - g) * DIM_FACTOR)
          rgbDimmed[idx + 2] = Math.round(b + (DIM_GRAY - b) * DIM_FACTOR)
          rgbHighlight[idx] = Math.round(r * (1 - HIGHLIGHT_DARKEN_FACTOR))
          rgbHighlight[idx + 1] = Math.round(g * (1 - HIGHLIGHT_DARKEN_FACTOR))
          rgbHighlight[idx + 2] = Math.round(b * (1 - HIGHLIGHT_DARKEN_FACTOR))
        }
        paletteRef.current = colorMap
        biomeRgbRef.current = rgb
        biomeRgbDimmedRef.current = rgbDimmed
        biomeRgbHighlightRef.current = rgbHighlight
      })
      .catch((err) => {
        if (cancelled) return
        const msg = String(err)
        setPaletteError({ message: msg, version: effectiveVersion })
        toast.error(`Falha ao carregar paleta de biomas: ${msg}`)
      })
    return () => {
      cancelled = true
    }
  }, [effectiveVersion])
  const createBiomeSource = useCallback(
    () =>
      createBiomeSourceImpl({
        seed,
        effectiveVersion,
        dimension,
        mapLayer,
        terrainModeRef,
        biomeRgbRef,
        biomeRgbDimmedRef,
        biomeRgbHighlightRef,
        highlightedBiomeIdsRef,
      }),
    [seed, effectiveVersion, dimension, mapLayer, terrainMode],
  )
  const enabledStructureIdsRef = useRef(enabledStructureIds)
  const prevEnabledStructureIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    enabledStructureIdsRef.current = enabledStructureIds
  }, [enabledStructureIds])
  const [structureSearchOpen, setStructureSearchOpen] = useState(false)
  const [structureSearchQuery, setStructureSearchQuery] = useState('')
  const [targetResults, setTargetResults] = useState<
    Array<{
      x: number
      z: number
    }>
  >([])
  const [targetResultIndex, setTargetResultIndex] = useState(0)
  const [targetSearching, setTargetSearching] = useState(false)
  const targetSearchTokenRef = useRef(0)
  const targetResultsRef = useRef<
    Array<{
      x: number
      z: number
    }>
  >([])
  useEffect(() => {
    targetResultsRef.current = targetResults
  }, [targetResults])
  const [targetSearchedRadius, setTargetSearchedRadius] = useState(0)
  const [targetResultsListOpen, setTargetResultsListOpen] = useState(false)
  const [targetedStructureId, setTargetedStructureId] = useState<string | null>(
    null,
  )
  const targetedStructureIdRef = useRef<string | null>(null)
  useEffect(() => {
    targetedStructureIdRef.current = targetedStructureId
  }, [targetedStructureId])
  const pinnedTargetKeyRef = useRef<string | null>(null)
  const searchOriginRef = useRef<{
    x: number
    z: number
  } | null>(null)
  const [searchOrigin, setSearchOrigin] = useState<{
    x: number
    z: number
  } | null>(null)
  const targetLineSourceRef = useRef<VectorSource | null>(null)
  const targetLineLayerRef = useRef<VectorLayer | null>(null)
  const strongholdCoveredBoundsRef = useRef<{
    minX: number
    minZ: number
    maxX: number
    maxZ: number
  } | null>(null)
  const {
    fetchVisibleSlimeChunks,
    updateTargetLine,
    fetchVisibleStructures,
    fetchStrongholds,
  } = useSeedMapFetchers({
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
  })
  useSeedMapInstance({
    mapDivRef,
    pendingPanRef,
    mapRef,
    biomeLayerRef,
    biomeSourceRef,
    spawnLayerRef,
    spawnSourceRef,
    slimeLayerRef,
    slimeSourceRef,
    structureLayerRef,
    structureSourceRef,
    targetLineLayerRef,
    targetLineSourceRef,
    customMarkerLayerRef,
    customMarkerSourceRef,
    customMarkerOverlayRef,
    structureOverlayRef,
    targetedStructureIdRef,
    enabledStructureIdsRef,
    seedRef,
    effectiveVersionRef,
    dimensionRef,
    mapLayerRef,
    hoverLastFetchedRef,
    hoverRequestIdRef,
    pinnedTargetKeyRef,
    targetResultsRef,
    structureCompletedMap,
    palette,
    setStructurePopup,
    setCustomMarkerDetailsOpen,
    setCustomMarkerPopup,
    setMapResolution,
    setStructuresHiddenByZoom,
    setHoverInfo,
    setTargetResultIndex,
    createBiomeSource,
    fetchVisibleSlimeChunks,
    fetchVisibleStructures,
    fetchStrongholds,
    updateTargetLine,
    customMarkerPopupEl,
    structurePopupEl,
    seed,
    effectiveVersion,
    dimension,
    mapLayer,
    getBiomeDisplayName,
  })
  useEffect(() => {
    fetchedSlimeChunksRef.current.clear()
    slimeSourceRef.current?.clear()
  }, [seed, dimension, showSlimeChunks])
  useEffect(() => {
    if (showSlimeChunks) fetchVisibleSlimeChunks()
  }, [showSlimeChunks, seed, dimension, fetchVisibleSlimeChunks])
  useEffect(() => {
    fetchedStructuresRef.current.clear()
    structureSourceRef.current?.clear()
    prevEnabledStructureIdsRef.current = new Set()
    strongholdCoveredBoundsRef.current = null
  }, [seed, dimension])
  useEffect(() => {
    structureCompletedMap.current = seed
      ? loadStructureCompleted(seed)
      : new Map()
  }, [seed])
  useEffect(() => {
    const prev = prevEnabledStructureIdsRef.current
    const source = structureSourceRef.current
    if (source) {
      for (const id of prev) {
        if (!enabledStructureIds.has(id)) {
          const toRemove = source
            .getFeatures()
            .filter((f) => f.get('structureId') === id)
          for (const f of toRemove) source.removeFeature(f)
          for (const key of fetchedStructuresRef.current) {
            if (key.startsWith(`${id},`))
              fetchedStructuresRef.current.delete(key)
          }
          if (id === 'stronghold') strongholdCoveredBoundsRef.current = null
          if (targetedStructureIdRef.current === id) {
            pinnedTargetKeyRef.current = null
            searchOriginRef.current = null
            setSearchOrigin(null)
            setTargetedStructureId(null)
            setTargetResults([])
            setTargetResultIndex(0)
            targetSearchTokenRef.current++
            setTargetSearching(false)
            setTargetResultsListOpen(false)
          }
        }
      }
      mapRef.current?.render()
    }
    prevEnabledStructureIdsRef.current = new Set(enabledStructureIds)
    if (enabledStructureIds.size > 0 && seedRef.current) {
      fetchVisibleStructures()
      if (enabledStructureIds.has('stronghold')) fetchStrongholds()
    }
  }, [enabledStructureIds, fetchVisibleStructures, fetchStrongholds])
  useEffect(() => {
    if (!seed || dimension !== 'overworld') return undefined
    let cancelled = false
    SeedMapAPI.getSpawnPoint({ seed, mcVersion: effectiveVersion })
      .then((pt) => {
        if (cancelled) return
        const source = spawnSourceRef.current
        if (!source) return
        spawnPointRef.current = [pt.x, -pt.z]
        source.clear()
        const feature = new Feature({
          geometry: new Point([pt.x, -pt.z]),
        })
        feature.setStyle(
          new OlStyle({
            image: new OlCircle({
              radius: 8,
              fill: new OlFill({ color: 'rgba(255, 50, 50, 0.85)' }),
              stroke: new OlStroke({ color: '#fff', width: 2 }),
            }),
          }),
        )
        source.addFeature(feature)
      })
      .catch((err) => {
        if (!cancelled)
          toast.error(`Falha ao buscar ponto de spawn: ${String(err)}`)
      })
    return () => {
      cancelled = true
    }
  }, [seed, effectiveVersion, dimension])
  useEffect(() => {
    showSlimeChunksRef.current = showSlimeChunks
    seedRef.current = seed
    dimensionRef.current = dimension
    mapLayerRef.current = mapLayer
    effectiveVersionRef.current = effectiveVersion
  })
  const highlightSwapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )
  useEffect(() => {
    highlightedBiomeIdsRef.current = highlightedBiomeIds
    if (highlightSwapTimeoutRef.current) {
      clearTimeout(highlightSwapTimeoutRef.current)
    }
    if (!biomeLayerRef.current) return
    highlightSwapTimeoutRef.current = setTimeout(() => {
      const newSource = createBiomeSource()
      biomeSourceRef.current = newSource
      biomeLayerRef.current?.setSource(newSource)
    }, 150)
    return () => {
      if (highlightSwapTimeoutRef.current) {
        clearTimeout(highlightSwapTimeoutRef.current)
      }
    }
  }, [highlightedBiomeIds, createBiomeSource])
  useEffect(() => {
    spawnLayerRef.current?.setVisible(showSpawn)
  }, [showSpawn])
  useEffect(() => {
    slimeLayerRef.current?.setVisible(showSlimeChunks)
  }, [showSlimeChunks])
  useEffect(() => {
    updateTargetLine()
    mapRef.current?.render()
  }, [targetedStructureId, updateTargetLine])
  useEffect(() => {
    const id = targetedStructureId
    const result = targetResults[targetResultIndex]
    if (!id || !result) return
    pinnedTargetKeyRef.current = `${result.x}:${result.z}`
    const source = structureSourceRef.current
    if (source) {
      const exists = source
        .getFeatures()
        .some(
          (f) =>
            f.get('structureId') === id &&
            f.get('x') === result.x &&
            f.get('z') === result.z,
        )
      if (!exists) {
        const feature = new Feature({
          geometry: new Point([result.x, -result.z]),
        })
        feature.set('structureId', id)
        feature.set('x', result.x)
        feature.set('z', result.z)
        source.addFeature(feature)
      }
    }
    const view = mapRef.current?.getView()
    if (view) {
      view.animate({ center: [result.x, -result.z], duration: 300 })
    }
    updateTargetLine()
    setStructurePopup({
      structureId: id,
      x: result.x,
      z: result.z,
      completed:
        structureCompletedMap.current.get(`${id}:${result.x}:${result.z}`) ??
        false,
    })
    const overlay = structureOverlayRef.current
    if (overlay) {
      const iconSizePx = getStructureIconSizePx(
        view?.getResolution() ?? RESOLUTION,
      )
      overlay.setOffset([0, -(iconSizePx / 2 + 8)])
      overlay.setPosition([result.x, -result.z])
    }
  }, [targetedStructureId, targetResults, targetResultIndex, updateTargetLine])
  const {
    handlePrevTargetResult,
    handleNextTargetResult,
    handleToggleBiomeHighlight,
    handleToggleStructure,
    handleSelectStructureSearch,
    handleClearStructureSearch,
    handleSelectBiomeSearch,
    handleGoToEquivalentDimension,
    handleCategoryFilterChange,
    handleGo,
    handleZoomIn,
    handleZoomOut,
    handleReset,
  } = useSeedMapControls({
    mapRef,
    spawnPointRef,
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
  })
  if (!isLoadingWorlds && worlds.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <TabHeader description="Mapa de biomas e estruturas do Overworld a partir da seed." />
        <EmptyState
          icon={MapIcon}
          title="Nenhum mundo encontrado"
          description="Inicie a instÃ¢ncia pelo menos uma vez para gerar dados de mundo."
          className="min-h-[60vh]"
        />
      </div>
    )
  }
  if (isLoadingWorlds) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <TabHeader description="Mapa de biomas e estruturas do Overworld a partir da seed." />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1" />
      </div>
    )
  }
  if (!seed) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <TabHeader description="Mapa de biomas e estruturas do Overworld a partir da seed." />
        <EmptyState
          icon={MapIcon}
          title="Seed nÃ£o disponÃ­vel"
          description="O mundo selecionado nÃ£o possui uma seed vÃ¡lida."
          className="min-h-[60vh]"
        />
      </div>
    )
  }
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <TabHeader description="Mapa de biomas e estruturas a partir da seed." />

      <SeedMapControlsRow
        worlds={worlds}
        selectedWorldName={selectedWorldName}
        setSelectedWorldName={setSelectedWorldName}
        dimension={dimension}
        setDimension={setDimension}
        mapLayer={mapLayer}
        setMapLayer={setMapLayer}
        versionOverride={versionOverride}
        setVersionOverride={setVersionOverride}
        mcVersion={mcVersion}
        gotoX={gotoX}
        setGotoX={setGotoX}
        gotoZ={gotoZ}
        setGotoZ={setGotoZ}
        handleGo={handleGo}
      />

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel minSize="300px">
          <div className="relative h-full min-w-0">
            <div
              ref={mapDivRef}
              className="h-full min-h-[400px] w-full overflow-hidden rounded-lg border"
            />
            {palette.length === 0 && !paletteError && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-lg bg-black/60 px-4 py-2 text-sm text-white">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Carregando paleta de biomas...
                </div>
              </div>
            )}
            {paletteError && paletteError.version === effectiveVersion && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <EmptyState
                  icon={MapIcon}
                  title="VersÃ£o nÃ£o suportada"
                  description={`O mapa de seed requer Minecraft 1.18 ou superior. ${paletteError.message}`}
                  className="min-h-0"
                />
              </div>
            )}
            {structuresHiddenByZoom && enabledStructureIds.size > 0 && (
              <div className="bg-background text-muted-foreground absolute top-2 left-2 z-10 rounded-lg border px-2 py-1 text-xs shadow-sm">
                Aproxime para ver as estruturas
              </div>
            )}
            <TargetResultsNavigator
              targetedStructureId={targetedStructureId}
              targetResultsListOpen={targetResultsListOpen}
              setTargetResultsListOpen={setTargetResultsListOpen}
              targetResults={targetResults}
              targetResultIndex={targetResultIndex}
              setTargetResultIndex={setTargetResultIndex}
              targetSearching={targetSearching}
              targetSearchedRadius={targetSearchedRadius}
              searchOrigin={searchOrigin}
              handlePrevTargetResult={handlePrevTargetResult}
              handleNextTargetResult={handleNextTargetResult}
            />
            <MapToolsOverlay
              handleZoomIn={handleZoomIn}
              handleZoomOut={handleZoomOut}
              targetedStructureId={targetedStructureId}
              setStructureSearchOpen={setStructureSearchOpen}
              handleClearStructureSearch={handleClearStructureSearch}
              handleReset={handleReset}
              terrainMode={terrainMode}
              setTerrainMode={setTerrainMode}
              dimension={dimension}
              mapLayer={mapLayer}
            />
            <MapStatusOverlay
              hoverInfo={hoverInfo}
              mapResolution={mapResolution}
            />
            {structurePopup &&
              createPortal(
                <StructurePopupContent
                  popup={structurePopup}
                  meta={getStructurePopupMeta(structurePopup.structureId)}
                  isSlimeChunk={
                    structurePopup.structureId === SLIME_CHUNK_POPUP_ID
                  }
                  coordsCopied={coordsCopied}
                  onCopyCoords={() => {
                    navigator.clipboard.writeText(
                      `${structurePopup.x} ${structurePopup.z}`,
                    )
                    setCoordsCopied(true)
                    setTimeout(() => setCoordsCopied(false), 2000)
                  }}
                  targetedStructureId={targetedStructureId}
                  searchOrigin={searchOrigin}
                  onToggleCompleted={(checked) => {
                    const key = `${structurePopup.structureId}:${structurePopup.x}:${structurePopup.z}`
                    structureCompletedMap.current.set(key, checked)
                    if (seed)
                      persistStructureCompleted(
                        seed,
                        structureCompletedMap.current,
                      )
                    setStructurePopup((prev) =>
                      prev ? { ...prev, completed: checked } : prev,
                    )
                  }}
                />,
                structurePopupEl,
              )}
            {customMarkerPopup &&
              createPortal(
                <CustomMarkerPopupContent
                  popup={customMarkerPopup}
                  coordsCopied={coordsCopied}
                  onCopyCoords={() => {
                    navigator.clipboard.writeText(
                      `${customMarkerPopup.x} ${customMarkerPopup.y} ${customMarkerPopup.z}`,
                    )
                    setCoordsCopied(true)
                    setTimeout(() => setCoordsCopied(false), 2000)
                  }}
                  detailsOpen={customMarkerDetailsOpen}
                  setDetailsOpen={setCustomMarkerDetailsOpen}
                  dimension={dimension}
                  onGoToEquivalentDimension={handleGoToEquivalentDimension}
                />,
                customMarkerPopupEl,
              )}
            <StructureSearchDialog
              structureSearchOpen={structureSearchOpen}
              setStructureSearchOpen={setStructureSearchOpen}
              structureSearchQuery={structureSearchQuery}
              setStructureSearchQuery={setStructureSearchQuery}
              structuresForDimension={structuresForDimension}
              enabledStructureIds={enabledStructureIds}
              handleSelectStructureSearch={handleSelectStructureSearch}
              dimensionPalette={dimensionPalette}
              highlightedBiomeIds={highlightedBiomeIds}
              handleSelectBiomeSearch={handleSelectBiomeSearch}
              getBiomeDisplayName={getBiomeDisplayName}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="256px" minSize="200px" maxSize="420px">
          <SeedMapLegendPanel
            categorizedPalette={categorizedPalette}
            highlightedBiomeIds={highlightedBiomeIds}
            handleToggleBiomeHighlight={handleToggleBiomeHighlight}
            getBiomeDisplayName={getBiomeDisplayName}
            biomeSearch={biomeSearch}
            setBiomeSearch={setBiomeSearch}
            presentBiomeCategories={presentBiomeCategories}
            activeBiomeCategories={activeBiomeCategories}
            handleCategoryFilterChange={handleCategoryFilterChange}
            showSpawn={showSpawn}
            setShowSpawn={setShowSpawn}
            showSlimeChunks={showSlimeChunks}
            setShowSlimeChunks={setShowSlimeChunks}
            dimension={dimension}
            structuresForDimension={structuresForDimension}
            enabledStructureIds={enabledStructureIds}
            handleToggleStructure={handleToggleStructure}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
