import { useEffect } from 'react'
import OlMap from 'ol/Map'
import View from 'ol/View'
import VectorSource from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector'
import WebGLTileLayer from 'ol/layer/WebGLTile'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Style as OlStyle, Fill as OlFill, Stroke as OlStroke } from 'ol/style'
import Overlay from 'ol/Overlay'
import { defaults as defaultInteractions } from 'ol/interaction/defaults'
import { SeedMapAPI } from '@/features/instances/services/seed-map.api'
import { STRUCTURE_BY_ID } from '@/features/instances/components/edit-instance/seed-map/components/seed-map-shared'
import {
  CUSTOM_MARKER_STYLE,
  getStructureHighlightRingStyle,
  getStructureIconSizePx,
  getStructureIconStyle,
} from '@/features/instances/components/edit-instance/seed-map/lib/map-styles'
import {
  DEFAULT_CENTER,
  DEFAULT_RESOLUTION,
  RESOLUTION,
  SLIME_MAX_RESOLUTION,
  VIEW_RESOLUTIONS,
  getStructureMaxResolution,
  mcProjection,
} from '@/features/instances/components/edit-instance/seed-map/lib/seed-map-geo'
import { SLIME_CHUNK_POPUP_ID } from '@/features/instances/components/edit-instance/seed-map/lib/seed-map-popups'
import { STRUCTURE_LIST } from '@/data/structure-metadata'
import type {
  BiomePaletteEntry,
  SeedMapDimension,
  SeedMapLayer,
} from '@/types/seed-map'
interface UseSeedMapInstanceParams {
  mapDivRef: React.RefObject<HTMLDivElement | null>
  pendingPanRef: React.RefObject<{
    x: number
    z: number
    placeMarker: boolean
  } | null>
  mapRef: React.RefObject<OlMap | null>
  biomeLayerRef: React.RefObject<WebGLTileLayer | null>
  biomeSourceRef: React.RefObject<import('ol/source/DataTile').default | null>
  spawnLayerRef: React.RefObject<VectorLayer | null>
  spawnSourceRef: React.RefObject<VectorSource | null>
  slimeLayerRef: React.RefObject<VectorLayer | null>
  slimeSourceRef: React.RefObject<VectorSource | null>
  structureLayerRef: React.RefObject<VectorLayer | null>
  structureSourceRef: React.RefObject<VectorSource | null>
  targetLineLayerRef: React.RefObject<VectorLayer | null>
  targetLineSourceRef: React.RefObject<VectorSource | null>
  customMarkerLayerRef: React.RefObject<VectorLayer | null>
  customMarkerSourceRef: React.RefObject<VectorSource | null>
  customMarkerOverlayRef: React.RefObject<Overlay | null>
  structureOverlayRef: React.RefObject<Overlay | null>
  targetedStructureIdRef: React.RefObject<string | null>
  enabledStructureIdsRef: React.RefObject<Set<string>>
  seedRef: React.RefObject<string | null>
  effectiveVersionRef: React.RefObject<string>
  dimensionRef: React.RefObject<SeedMapDimension>
  mapLayerRef: React.RefObject<SeedMapLayer>
  hoverLastFetchedRef: React.RefObject<{ x: number; z: number } | null>
  hoverRequestIdRef: React.RefObject<number>
  pinnedTargetKeyRef: React.RefObject<string | null>
  targetResultsRef: React.RefObject<Array<{ x: number; z: number }>>
  structureCompletedMap: React.RefObject<Map<string, boolean>>
  palette: BiomePaletteEntry[]
  setStructurePopup: React.Dispatch<
    React.SetStateAction<{
      structureId: string
      x: number
      z: number
      y: number | null
      completed: boolean
    } | null>
  >
  setCustomMarkerDetailsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setCustomMarkerPopup: React.Dispatch<
    React.SetStateAction<{
      x: number
      y: number
      z: number
      biomeName: string | null
      biomeColor: string | null
    } | null>
  >
  setMapResolution: React.Dispatch<React.SetStateAction<number>>
  setStructuresHiddenByZoom: React.Dispatch<React.SetStateAction<boolean>>
  showSlimeChunksRef: React.RefObject<boolean>
  setSlimeHiddenByZoom: React.Dispatch<React.SetStateAction<boolean>>
  setHoverInfo: React.Dispatch<
    React.SetStateAction<{
      x: number
      z: number
      y: number | null
      biomeName: string | null
      biomeColor: string | null
    } | null>
  >
  setTargetResultIndex: React.Dispatch<React.SetStateAction<number>>
  createBiomeSource: () => import('ol/source/DataTile').default
  fetchVisibleSlimeChunks: () => void
  fetchVisibleStructures: () => void
  fetchStrongholds: () => void
  updateTargetLine: () => void
  customMarkerPopupEl: HTMLDivElement
  structurePopupEl: HTMLDivElement
  seed: string | null
  effectiveVersion: string
  dimension: SeedMapDimension
  mapLayer: SeedMapLayer
  getBiomeDisplayName: (entry: BiomePaletteEntry) => string
  placeCustomMarkerRef: React.RefObject<((x: number, z: number) => void) | null>
  handleClearStructureSearchRef: React.RefObject<(() => void) | null>
}
export function useSeedMapInstance({
  mapDivRef,
  placeCustomMarkerRef,
  handleClearStructureSearchRef,
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
  showSlimeChunksRef,
  setSlimeHiddenByZoom,
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
}: UseSeedMapInstanceParams) {
  useEffect(() => {
    if (!mapDivRef.current || palette.length === 0) return
    const biomeSource = createBiomeSource()
    const biomeLayer = new WebGLTileLayer({
      source: biomeSource,
      preload: 1,
      cacheSize: 1024,
    })
    const spawnSource = new VectorSource()
    const spawnLayer = new VectorLayer({
      source: spawnSource,
      zIndex: 10,
    })
    const slimeSource = new VectorSource()
    const slimeLayer = new VectorLayer({
      source: slimeSource,
      zIndex: 5,
      maxResolution: SLIME_MAX_RESOLUTION,
      style: new OlStyle({
        fill: new OlFill({ color: 'rgba(100, 220, 100, 0.6)' }),
        stroke: new OlStroke({ color: 'rgba(40, 120, 40, 0.9)', width: 1 }),
      }),
    })
    const structureSource = new VectorSource()
    const structureLayer = new VectorLayer({
      source: structureSource,
      zIndex: 8,
      style: (feature, resolution) => {
        const structureId = feature.get('structureId') as string
        const structure = STRUCTURE_BY_ID.get(structureId)
        if (!structure) return undefined
        if (resolution >= getStructureMaxResolution(structure)) return undefined
        const iconStyle = getStructureIconStyle(structureId, resolution)
        if (!iconStyle) return undefined
        if (structureId === targetedStructureIdRef.current) {
          return [
            getStructureHighlightRingStyle(getStructureIconSizePx(resolution)),
            iconStyle,
          ]
        }
        return iconStyle
      },
    })
    const targetLineSource = new VectorSource()
    const targetLineLayer = new VectorLayer({
      source: targetLineSource,
      zIndex: 11,
    })
    const customMarkerSource = new VectorSource()
    const customMarkerLayer = new VectorLayer({
      source: customMarkerSource,
      zIndex: 12,
      style: CUSTOM_MARKER_STYLE,
    })
    const pendingPan = pendingPanRef.current
    const initialCenter = pendingPan
      ? ([pendingPan.x, -pendingPan.z] as [number, number])
      : DEFAULT_CENTER
    pendingPanRef.current = null
    const map = new OlMap({
      target: mapDivRef.current,
      controls: [],
      interactions: defaultInteractions({ doubleClickZoom: false }),
      maxTilesLoading: 8,
      layers: [
        biomeLayer,
        slimeLayer,
        structureLayer,
        spawnLayer,
        targetLineLayer,
        customMarkerLayer,
      ],
      view: new View({
        center: initialCenter,
        resolution: DEFAULT_RESOLUTION,
        projection: mcProjection,
        resolutions: VIEW_RESOLUTIONS,
        constrainOnlyCenter: true,
        smoothResolutionConstraint: false,
      }),
    })
    mapRef.current = map
    biomeLayerRef.current = biomeLayer
    biomeSourceRef.current = biomeSource
    spawnLayerRef.current = spawnLayer
    spawnSourceRef.current = spawnSource
    slimeLayerRef.current = slimeLayer
    slimeSourceRef.current = slimeSource
    structureLayerRef.current = structureLayer
    structureSourceRef.current = structureSource
    targetLineLayerRef.current = targetLineLayer
    targetLineSourceRef.current = targetLineSource
    customMarkerLayerRef.current = customMarkerLayer
    customMarkerSourceRef.current = customMarkerSource
    const customMarkerOverlay = new Overlay({
      element: customMarkerPopupEl,
      positioning: 'bottom-center',
      offset: [0, -40],
      autoPan: { animation: { duration: 250 } },
    })
    map.addOverlay(customMarkerOverlay)
    customMarkerOverlayRef.current = customMarkerOverlay
    const placeCustomMarker = (x: number, z: number) => {
      if (!seedRef.current) return
      customMarkerSource.clear()
      const feature = new Feature({ geometry: new Point([x, -z]) })
      feature.set('customMarker', true)
      feature.set('x', x)
      feature.set('z', z)
      customMarkerSource.addFeature(feature)
      setStructurePopup(null)
      structureOverlayRef.current?.setPosition(undefined)
      setCustomMarkerDetailsOpen(false)
      setCustomMarkerPopup({ x, y: 0, z, biomeName: null, biomeColor: null })
      customMarkerOverlay.setPosition([x, -z])
      map.render()
      SeedMapAPI.getColumnInfo({
        seed: seedRef.current,
        mcVersion: effectiveVersionRef.current,
        dimension: dimensionRef.current,
        layer: mapLayerRef.current,
        x,
        z,
      })
        .then((info) => {
          const entry = palette.find((p) => p.id === info.biomeId)
          const biomeName = entry ? getBiomeDisplayName(entry) : null
          const biomeColor = entry?.colorHex ?? null
          feature.set('y', info.y)
          feature.set('biomeName', biomeName)
          feature.set('biomeColor', biomeColor)
          setCustomMarkerPopup((prev) =>
            prev && prev.x === x && prev.z === z
              ? { ...prev, y: info.y, biomeName, biomeColor }
              : prev,
          )
        })
        .catch(() => {})
    }
    if (pendingPan?.placeMarker) {
      placeCustomMarker(pendingPan.x, pendingPan.z)
    }
    placeCustomMarkerRef.current = placeCustomMarker
    const handleContextMenu = (evt: MouseEvent) => {
      evt.preventDefault()
      const pixel = map.getEventPixel(evt)
      const coordinate = map.getCoordinateFromPixel(pixel)
      if (!coordinate) return
      placeCustomMarker(Math.round(coordinate[0]), Math.round(-coordinate[1]))
    }
    mapDivRef.current.addEventListener('contextmenu', handleContextMenu)
    const structureOverlay = new Overlay({
      element: structurePopupEl,
      positioning: 'bottom-center',
      offset: [0, -8],
      autoPan: { animation: { duration: 250 } },
    })
    map.addOverlay(structureOverlay)
    structureOverlayRef.current = structureOverlay
    const updateStructuresZoomState = () => {
      const resolution = map.getView().getResolution() ?? RESOLUTION
      setMapResolution(resolution)
      const enabledIds = enabledStructureIdsRef.current
      const anyVisible = STRUCTURE_LIST.some(
        (s) =>
          enabledIds.has(s.id) && resolution < getStructureMaxResolution(s),
      )
      const hidden = enabledIds.size > 0 && !anyVisible
      setStructuresHiddenByZoom((prev) => (prev === hidden ? prev : hidden))
      if (hidden) {
        setStructurePopup(null)
        structureOverlay.setPosition(undefined)
      }
      const slimeHidden =
        showSlimeChunksRef.current && resolution > SLIME_MAX_RESOLUTION
      setSlimeHiddenByZoom((prev) =>
        prev === slimeHidden ? prev : slimeHidden,
      )
      const targetedId = targetedStructureIdRef.current
      const targetedStructure = targetedId
        ? STRUCTURE_BY_ID.get(targetedId)
        : undefined
      if (
        targetedStructure &&
        resolution >= getStructureMaxResolution(targetedStructure)
      ) {
        handleClearStructureSearchRef.current?.()
      }
    }
    updateStructuresZoomState()
    map.on('moveend', () => {
      fetchVisibleSlimeChunks()
      fetchVisibleStructures()
      if (enabledStructureIdsRef.current.has('stronghold')) fetchStrongholds()
      updateStructuresZoomState()
      updateTargetLine()
    })
    let isPointerDown = false
    let isDragging = false
    let holdTimeoutId: number | null = null
    let downClientPos: [number, number] | null = null
    const clearHoldTimeout = () => {
      if (holdTimeoutId !== null) {
        window.clearTimeout(holdTimeoutId)
        holdTimeoutId = null
      }
    }
    const setMapCursor = (cursor: 'grab' | 'grabbing' | 'pointer' | null) => {
      const el = mapDivRef.current
      if (!el) return
      el.classList.remove('cursor-grab', 'cursor-grabbing', 'cursor-pointer')
      if (cursor) el.classList.add(`cursor-${cursor}`)
    }
    const handleMouseDown = (evt: MouseEvent) => {
      if (evt.button !== 0) return
      isPointerDown = true
      isDragging = false
      downClientPos = [evt.clientX, evt.clientY]
      clearHoldTimeout()
      holdTimeoutId = window.setTimeout(() => {
        if (isPointerDown) {
          isDragging = true
          setMapCursor('grabbing')
        }
      }, 1000)
    }
    const handleMouseMoveForDrag = (evt: MouseEvent) => {
      if (!isPointerDown || !downClientPos) return
      if (isDragging) return
      const dx = evt.clientX - downClientPos[0]
      const dy = evt.clientY - downClientPos[1]
      if (Math.hypot(dx, dy) > 3) {
        isDragging = true
        clearHoldTimeout()
        setMapCursor('grabbing')
      }
    }
    const handleMouseUp = () => {
      isPointerDown = false
      isDragging = false
      clearHoldTimeout()
      setMapCursor(null)
    }
    mapDivRef.current.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMoveForDrag)
    window.addEventListener('mouseup', handleMouseUp)
    let cursorRafId: number | null = null
    let pendingCursorPixel: number[] | null = null
    const flushCursorHitTest = () => {
      cursorRafId = null
      if (isPointerDown || !pendingCursorPixel) return
      const hoveredFeature = map.forEachFeatureAtPixel(
        pendingCursorPixel,
        (f) => f,
        {
          layerFilter: (l) =>
            l === structureLayerRef.current ||
            l === slimeLayerRef.current ||
            l === customMarkerLayerRef.current ||
            l === spawnLayerRef.current,
        },
      )
      setMapCursor(hoveredFeature ? 'pointer' : null)
    }
    const handlePointerMove = (evt: {
      coordinate: number[]
      pixel: number[]
    }) => {
      if (!isPointerDown) {
        pendingCursorPixel = evt.pixel
        if (cursorRafId === null) {
          cursorRafId = requestAnimationFrame(flushCursorHitTest)
        }
      }
      const bx = Math.floor(evt.coordinate[0])
      const bz = Math.floor(-evt.coordinate[1])
      setHoverInfo((prev) =>
        prev?.x === bx && prev.z === bz
          ? prev
          : {
              x: bx,
              z: bz,
              y: prev?.y ?? null,
              biomeName: prev?.biomeName ?? null,
              biomeColor: prev?.biomeColor ?? null,
            },
      )
      if (
        hoverLastFetchedRef.current?.x === bx &&
        hoverLastFetchedRef.current?.z === bz
      )
        return
      hoverLastFetchedRef.current = { x: bx, z: bz }
      if (!seedRef.current) return
      const reqId = ++hoverRequestIdRef.current
      SeedMapAPI.getColumnInfo({
        seed: seedRef.current,
        mcVersion: effectiveVersionRef.current,
        dimension: dimensionRef.current,
        layer: mapLayerRef.current,
        x: bx,
        z: bz,
      })
        .then((info) => {
          if (reqId !== hoverRequestIdRef.current) return
          const entry = palette.find((p) => p.id === info.biomeId)
          setHoverInfo((prev) =>
            prev && prev.x === bx && prev.z === bz
              ? {
                  ...prev,
                  y: info.y,
                  biomeName: entry ? getBiomeDisplayName(entry) : null,
                  biomeColor: entry?.colorHex ?? null,
                }
              : prev,
          )
        })
        .catch(() => {})
    }
    const handlePointerLeave = () => {
      hoverLastFetchedRef.current = null
      setHoverInfo(null)
      if (!isPointerDown) setMapCursor(null)
    }
    map.on('pointermove', handlePointerMove)
    mapDivRef.current.addEventListener('pointerleave', handlePointerLeave)
    map.on('click', (evt: { pixel: number[]; coordinate: number[] }) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
        layerFilter: (l) => l === structureLayerRef.current,
      })
      if (feature) {
        const structureId = feature.get('structureId') as string
        const x = feature.get('x') as number
        const z = feature.get('z') as number
        setStructurePopup({
          structureId,
          x,
          z,
          y: null,
          completed:
            structureCompletedMap.current.get(`${structureId}:${x}:${z}`) ??
            false,
        })
        if (seedRef.current) {
          SeedMapAPI.getColumnInfo({
            seed: seedRef.current,
            mcVersion: effectiveVersionRef.current,
            dimension: dimensionRef.current,
            layer: mapLayerRef.current,
            x,
            z,
          })
            .then((info) => {
              setStructurePopup((prev) =>
                prev &&
                prev.structureId === structureId &&
                prev.x === x &&
                prev.z === z
                  ? { ...prev, y: info.y }
                  : prev,
              )
            })
            .catch(() => {})
        }
        const iconSizePx = getStructureIconSizePx(
          map.getView().getResolution() ?? RESOLUTION,
        )
        structureOverlay.setOffset([0, -(iconSizePx / 2 + 8)])
        structureOverlay.setPosition([x, -z])
        if (structureId === targetedStructureIdRef.current) {
          pinnedTargetKeyRef.current = `${x}:${z}`
          const idx = targetResultsRef.current.findIndex(
            (r) => r.x === x && r.z === z,
          )
          if (idx >= 0) setTargetResultIndex(idx)
          updateTargetLine()
        }
        return
      }
      const slimeFeature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
        layerFilter: (l) => l === slimeLayerRef.current,
      })
      if (slimeFeature) {
        const chunkX = slimeFeature.get('chunkX') as number
        const chunkZ = slimeFeature.get('chunkZ') as number
        const x = chunkX * 16 + 8
        const z = chunkZ * 16 + 8
        setCustomMarkerPopup(null)
        customMarkerOverlay.setPosition(undefined)
        setStructurePopup({
          structureId: SLIME_CHUNK_POPUP_ID,
          x,
          z,
          y: null,
          completed: false,
        })
        structureOverlay.setOffset([0, -8])
        structureOverlay.setPosition([x, -z])
        return
      }
      const markerFeature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
        layerFilter: (l) => l === customMarkerLayerRef.current,
      })
      if (markerFeature) {
        setStructurePopup(null)
        structureOverlay.setPosition(undefined)
        const x = markerFeature.get('x') as number
        const z = markerFeature.get('z') as number
        setCustomMarkerDetailsOpen(false)
        setCustomMarkerPopup({
          x,
          y: (markerFeature.get('y') as number) ?? 0,
          z,
          biomeName: (markerFeature.get('biomeName') as string) ?? null,
          biomeColor: (markerFeature.get('biomeColor') as string) ?? null,
        })
        customMarkerOverlay.setPosition([x, -z])
        return
      }
      setStructurePopup(null)
      structureOverlay.setPosition(undefined)
      setCustomMarkerPopup(null)
      customMarkerOverlay.setPosition(undefined)
    })
    const ro = new ResizeObserver(() => map.updateSize())
    ro.observe(mapDivRef.current)
    return () => {
      ro.disconnect()
      map.un('pointermove', handlePointerMove)
      mapDivRef.current?.removeEventListener('pointerleave', handlePointerLeave)
      mapDivRef.current?.removeEventListener('contextmenu', handleContextMenu)
      mapDivRef.current?.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMoveForDrag)
      window.removeEventListener('mouseup', handleMouseUp)
      clearHoldTimeout()
      if (cursorRafId !== null) cancelAnimationFrame(cursorRafId)
      map.setTarget(undefined)
      mapRef.current = null
      biomeLayerRef.current = null
      biomeSourceRef.current = null
      spawnLayerRef.current = null
      spawnSourceRef.current = null
      slimeLayerRef.current = null
      slimeSourceRef.current = null
      placeCustomMarkerRef.current = null
    }
  }, [
    seed,
    effectiveVersion,
    dimension,
    mapLayer,
    palette.length,
    palette,
    createBiomeSource,
    structurePopupEl,
    customMarkerPopupEl,
  ])
}
