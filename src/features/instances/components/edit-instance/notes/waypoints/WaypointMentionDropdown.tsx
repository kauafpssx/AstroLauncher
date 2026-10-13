import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { MapPin } from 'lucide-react'
import type { WaypointDTO } from '@/types/waypoint'
import { WAYPOINT_ICONS } from './waypoint-icons'
const DIMENSION_SYMBOLS: Record<string, string> = {
  overworld: '~',
  nether: '#',
  end: '∞',
}
interface WaypointMentionDropdownProps {
  items: WaypointDTO[]
  command: (attrs: Record<string, unknown>) => void
}
export interface WaypointMentionDropdownRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}
export const WaypointMentionDropdown = forwardRef<
  WaypointMentionDropdownRef,
  WaypointMentionDropdownProps
>(function WaypointMentionDropdown({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    setSelectedIndex(0)
  }, [items])
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as
      HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])
  const selectItem = (index: number) => {
    const wp = items[index]
    if (!wp) return
    command({
      waypointId: wp.id,
      name: wp.name,
      icon: wp.icon,
      dimension: wp.dimension,
      x: wp.x,
      y: wp.y,
      z: wp.z,
    })
  }
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))
  if (items.length === 0) {
    return (
      <div className="bg-popover text-muted-foreground min-w-48 rounded-lg border p-2 text-sm shadow-md">
        Nenhum waypoint encontrado
      </div>
    )
  }
  return (
    <div
      ref={listRef}
      className="bg-popover min-w-48 overflow-hidden rounded-lg border p-1 shadow-md"
    >
      {items.map((wp, index) => {
        const Icon =
          WAYPOINT_ICONS.find((i) => i.name === wp.icon)?.icon ?? MapPin
        const symbol = DIMENSION_SYMBOLS[wp.dimension] ?? '~'
        const yPart = wp.y != null ? ` Y: ${wp.y}` : ''
        return (
          <button
            key={wp.id}
            type="button"
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${index === selectedIndex ? 'bg-accent text-accent-foreground' : ''}`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate font-medium">{wp.name}</span>
            <span className="text-muted-foreground ml-auto shrink-0 text-xs">
              {symbol} X: {wp.x}
              {yPart} Z: {wp.z}
            </span>
          </button>
        )
      })}
    </div>
  )
})
