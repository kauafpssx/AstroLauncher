import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WaypointDTO } from '@/types/waypoint'
import { WAYPOINT_ICONS } from './waypoint-icons'
const DIMENSION_LABELS: Record<WaypointDTO['dimension'], string> = {
  overworld: 'Overworld',
  nether: 'Nether',
  end: 'End',
}
function getIconComponent(iconName: string) {
  return WAYPOINT_ICONS.find((i) => i.name === iconName)?.icon
}
interface WaypointListItemProps {
  waypoint: WaypointDTO
  onEdit: (wp: WaypointDTO) => void
  onDelete: (wp: WaypointDTO) => void
}
export function WaypointListItem({
  waypoint,
  onEdit,
  onDelete,
}: WaypointListItemProps) {
  const Icon = getIconComponent(waypoint.icon)
  return (
    <div className="bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2">
      <div className="text-muted-foreground bg-background flex size-8 shrink-0 items-center justify-center rounded-md">
        {/* eslint-disable-next-line react-hooks/static-components */}
        {Icon ? <Icon className="size-4" /> : <span>?</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{waypoint.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {DIMENSION_LABELS[waypoint.dimension]} | X: {waypoint.x}
          {waypoint.y != null ? ` Y: ${waypoint.y}` : ''} Z: {waypoint.z}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(waypoint)}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(waypoint)}
        >
          <Trash2 className="text-destructive size-3.5" />
        </Button>
      </div>
    </div>
  )
}
