import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { WAYPOINT_ICONS } from './waypoint-icons'
const DIMENSION_SYMBOLS: Record<string, string> = {
  overworld: '~',
  nether: '#',
  end: '∞',
}
export function WaypointMentionNodeView({ node }: NodeViewProps) {
  const { name, icon, dimension, x, y, z } = node.attrs as {
    name: string
    icon: string
    dimension: string
    x: number
    y: number | null
    z: number
  }
  const Icon = WAYPOINT_ICONS.find((i) => i.name === icon)?.icon ?? MapPin
  const symbol = DIMENSION_SYMBOLS[dimension] ?? '~'
  const yPart = y != null ? ` Y: ${y}` : ''
  return (
    <NodeViewWrapper as="span" className="inline-block align-middle">
      <Badge
        variant="secondary"
        className="gap-1 px-1.5 py-0 text-xs"
        contentEditable={false}
      >
        <Icon className="size-3" />
        <span>{name}</span>
        <span className="text-muted-foreground">
          {symbol} X: {x}
          {yPart} Z: {z}
        </span>
      </Badge>
    </NodeViewWrapper>
  )
}
