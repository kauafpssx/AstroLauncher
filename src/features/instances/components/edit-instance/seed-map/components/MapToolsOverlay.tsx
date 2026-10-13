import { LocateFixed, Mountain, ZoomIn, ZoomOut } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { SeedMapDimension, SeedMapLayer } from '@/types/seed-map'
interface MapToolsOverlayProps {
  handleZoomIn: () => void
  handleZoomOut: () => void
  handleReset: () => void
  terrainMode: boolean
  setTerrainMode: Dispatch<SetStateAction<boolean>>
  dimension: SeedMapDimension
  mapLayer: SeedMapLayer
}
export function MapToolsOverlay({
  handleZoomIn,
  handleZoomOut,
  handleReset,
  terrainMode,
  setTerrainMode,
  dimension,
  mapLayer,
}: MapToolsOverlayProps) {
  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="outline"
              className="!bg-background"
              onClick={handleZoomIn}
            >
              <ZoomIn className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Aumentar zoom</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="outline"
              className="!bg-background"
              onClick={handleZoomOut}
            >
              <ZoomOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Diminuir zoom</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="outline"
              className="!bg-background"
              onClick={handleReset}
            >
              <LocateFixed className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Ir para o spawn</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant={terrainMode ? 'default' : 'outline'}
              className={cn(!terrainMode && '!bg-background')}
              onClick={() => setTerrainMode((v) => !v)}
              disabled={dimension !== 'overworld' || mapLayer !== 'surface'}
            >
              <Mountain className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {dimension !== 'overworld' || mapLayer !== 'surface'
              ? 'Relevo (só no Overworld/Superfície)'
              : terrainMode
                ? 'Desativar relevo'
                : 'Ativar relevo'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
