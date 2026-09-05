import {
  Style as OlStyle,
  Fill as OlFill,
  Stroke as OlStroke,
  Circle as OlCircle,
  Icon as OlIcon,
} from 'ol/style'
import { STRUCTURE_BY_ID } from '@/features/instances/components/edit-instance/seed-map/components/seed-map-shared'
export function getStructureIconSizePx(resolution: number): number {
  return Math.min(72, Math.max(40, 40 + resolution * 2.5))
}
const STRUCTURE_ICON_CACHE = new Map<string, OlStyle>()
export function getStructureIconStyle(
  structureId: string,
  resolution: number,
): OlStyle | undefined {
  const structure = STRUCTURE_BY_ID.get(structureId)
  if (!structure) return undefined
  const sizePx = getStructureIconSizePx(resolution)
  const cacheKey = `${structureId}:${sizePx}`
  const cached = STRUCTURE_ICON_CACHE.get(cacheKey)
  if (cached) return cached
  const style = new OlStyle({
    image: new OlIcon({
      src: structure.iconPath,
      scale: sizePx / 128,
      anchor: [0.5, 0.5],
    }),
  })
  STRUCTURE_ICON_CACHE.set(cacheKey, style)
  return style
}
const HIGHLIGHT_RING_CACHE = new Map<number, OlStyle>()
export function getStructureHighlightRingStyle(sizePx: number): OlStyle {
  const cached = HIGHLIGHT_RING_CACHE.get(sizePx)
  if (cached) return cached
  const style = new OlStyle({
    image: new OlCircle({
      radius: sizePx / 2 + 3,
      fill: new OlFill({ color: 'rgba(255, 140, 0, 0.35)' }),
      stroke: new OlStroke({ color: '#ff8c00', width: 2 }),
    }),
  })
  HIGHLIGHT_RING_CACHE.set(sizePx, style)
  return style
}
const TARGET_CROSSHAIR_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">' +
      '<circle cx="14" cy="14" r="10" fill="rgba(0,0,0,0.35)" stroke="white" stroke-width="2"/>' +
      '<line x1="14" y1="3" x2="14" y2="25" stroke="white" stroke-width="2"/>' +
      '<line x1="3" y1="14" x2="25" y2="14" stroke="white" stroke-width="2"/>' +
      '</svg>',
  )
export const TARGET_CROSSHAIR_STYLE = new OlStyle({
  image: new OlIcon({ src: TARGET_CROSSHAIR_SVG, scale: 1 }),
})
export const TARGET_LINE_STYLE = new OlStyle({
  stroke: new OlStroke({
    color: 'rgba(255, 255, 255, 0.85)',
    width: 2,
    lineDash: [6, 4],
  }),
})
const CUSTOM_MARKER_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">' +
      '<path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z" fill="#e11d2e" stroke="white" stroke-width="2"/>' +
      '<circle cx="16" cy="16" r="6" fill="white"/>' +
      '</svg>',
  )
export const CUSTOM_MARKER_STYLE = new OlStyle({
  image: new OlIcon({ src: CUSTOM_MARKER_SVG, anchor: [0.5, 1] }),
})
export const DIM_GRAY = 210
export const DIM_FACTOR = 0.78
export const HIGHLIGHT_DARKEN_FACTOR = 0.4
