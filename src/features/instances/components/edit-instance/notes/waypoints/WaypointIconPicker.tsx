import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WAYPOINT_ICONS } from './waypoint-icons'
interface WaypointIconPickerProps {
  value: string
  onChange: (name: string) => void
}
export function WaypointIconPicker({
  value,
  onChange,
}: WaypointIconPickerProps) {
  const SelectedIcon =
    WAYPOINT_ICONS.find((i) => i.name === value)?.icon ?? MapPin
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">Ícone:</span>
        <SelectedIcon className="size-4" />
        <span className="text-xs">{value}</span>
      </div>
      <div className="grid max-h-32 grid-cols-10 gap-1 overflow-y-auto rounded-md border p-1">
        {WAYPOINT_ICONS.map(({ name, icon: Icon }) => (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onChange(name)}
            className={cn(
              'hover:bg-accent flex size-7 items-center justify-center rounded-md transition-colors',
              value === name && 'bg-accent text-accent-foreground',
            )}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
    </div>
  )
}
