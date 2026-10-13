import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
} from 'lucide-react'
import { STRUCTURE_LIST } from '@/data/structure-metadata'
export const STRUCTURE_BY_ID = new Map(STRUCTURE_LIST.map((s) => [s.id, s]))
export const MAX_TARGET_RESULTS = 99
const DIRECTION_ARROW_ICONS = [
  ArrowRight,
  ArrowDownRight,
  ArrowDown,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
]
export function getDirectionArrowIcon(dx: number, dz: number) {
  const deg = (Math.atan2(dz, dx) * 180) / Math.PI
  const normalized = (deg + 360) % 360
  const idx = Math.round(normalized / 45) % 8
  return DIRECTION_ARROW_ICONS[idx]
}
export function formatBlockDistance(blocks: number): string {
  if (blocks < 1000) return `${Math.round(blocks)}m`
  return `${(blocks / 1000).toFixed(1)}km`
}
