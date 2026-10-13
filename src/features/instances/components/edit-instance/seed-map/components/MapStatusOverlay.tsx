import { Crosshair, Search } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
interface HoverInfo {
  x: number
  z: number
  y: number | null
  biomeName: string | null
  biomeColor: string | null
}
interface MapStatusOverlayProps {
  hoverInfo: HoverInfo | null
  mapResolution: number
}
export function MapStatusOverlay({
  hoverInfo,
  mapResolution,
}: MapStatusOverlayProps) {
  return (
    <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2">
      {hoverInfo && (
        <div className="bg-background flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs">
          <Crosshair className="text-muted-foreground size-3.5" />
          <span>
            X: {hoverInfo.x.toLocaleString()}
            {hoverInfo.y !== null &&
              ` Y: ${hoverInfo.y.toLocaleString()}`} Z:{' '}
            {hoverInfo.z.toLocaleString()}
          </span>
          {hoverInfo.biomeName && (
            <>
              <Separator orientation="vertical" className="h-3.5" />
              <span
                className="size-2.5 shrink-0 rounded-full border border-white/20"
                style={{ backgroundColor: hoverInfo.biomeColor ?? undefined }}
              />
              <span className="text-white">{hoverInfo.biomeName}</span>
            </>
          )}
        </div>
      )}
      <div className="bg-background flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs">
        <Search className="text-muted-foreground size-3.5" />
        <span>{(1 / mapResolution).toFixed(2)}x</span>
      </div>
    </div>
  )
}
