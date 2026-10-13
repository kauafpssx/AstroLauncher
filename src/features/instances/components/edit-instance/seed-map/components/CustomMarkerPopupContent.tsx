import type { Dispatch, SetStateAction } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  X,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { SeedMapDimension } from '@/types/seed-map'
export function CustomMarkerPopupContent({
  popup,
  coordsCopied,
  onCopyCoords,
  onClose,
  detailsOpen,
  setDetailsOpen,
  dimension,
  onGoToEquivalentDimension,
}: {
  popup: {
    x: number
    y: number
    z: number
    biomeName: string | null
    biomeColor: string | null
  }
  coordsCopied: boolean
  onCopyCoords: () => void
  onClose: () => void
  detailsOpen: boolean
  setDetailsOpen: Dispatch<SetStateAction<boolean>>
  dimension: SeedMapDimension
  onGoToEquivalentDimension: (
    target: SeedMapDimension,
    x: number,
    z: number,
  ) => void
}) {
  return (
    <TooltipProvider>
      <div className="bg-background pointer-events-auto relative max-w-sm min-w-[180px] rounded-lg border p-2.5 shadow-md">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Marcador</span>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onCopyCoords}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {coordsCopied ? (
                    <Check className="size-3.5 text-green-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Copiar coordenadas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Remover marcador</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="text-muted-foreground mb-1.5 text-xs">
          X: {popup.x} Y: {popup.y} Z: {popup.z}
        </div>
        {popup.biomeName && (
          <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs">
            <span>Bioma:</span>
            <span
              className="size-2.5 shrink-0 rounded-full border border-white/20"
              style={{ backgroundColor: popup.biomeColor ?? undefined }}
            />
            <span>{popup.biomeName}</span>
          </div>
        )}
        <Separator className="mb-1.5" />
        <button
          type="button"
          onClick={() => setDetailsOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1 text-xs"
        >
          Detalhes
          {detailsOpen ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
        {detailsOpen && (
          <div className="mt-1.5 flex flex-col gap-1 border-t pt-1.5 text-xs">
            <div className="text-muted-foreground">
              Chunk X: {Math.floor(popup.x / 16)} Z: {Math.floor(popup.z / 16)}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() =>
                    onGoToEquivalentDimension(
                      dimension === 'overworld' ? 'nether' : 'overworld',
                      dimension === 'overworld'
                        ? Math.round(popup.x / 8)
                        : popup.x * 8,
                      dimension === 'overworld'
                        ? Math.round(popup.z / 8)
                        : popup.z * 8,
                    )
                  }
                  disabled={dimension === 'end'}
                  className="flex items-center gap-1 text-left text-blue-500 hover:underline disabled:pointer-events-none disabled:opacity-40"
                >
                  {dimension === 'overworld' ? 'Nether' : 'Overworld'}: X{' '}
                  {dimension === 'overworld'
                    ? Math.round(popup.x / 8)
                    : popup.x * 8}{' '}
                  Z{' '}
                  {dimension === 'overworld'
                    ? Math.round(popup.z / 8)
                    : popup.z * 8}
                  <ArrowUpRight className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Ir para a coordenada equivalente no{' '}
                {dimension === 'overworld' ? 'Nether' : 'Overworld'}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        <div className="bg-background absolute top-full left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b" />
      </div>
    </TooltipProvider>
  )
}
