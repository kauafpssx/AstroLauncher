import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  X,
} from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  MAX_TARGET_RESULTS,
  STRUCTURE_BY_ID,
  formatBlockDistance,
  getDirectionArrowIcon,
} from './seed-map-shared'
import { TruncatedLabel } from './TruncatedLabel'
interface TargetResultsNavigatorProps {
  targetedStructureId: string | null
  targetResultsListOpen: boolean
  setTargetResultsListOpen: Dispatch<SetStateAction<boolean>>
  targetResults: Array<{
    x: number
    z: number
  }>
  targetResultYs: Map<string, number>
  targetResultIndex: number
  setTargetResultIndex: Dispatch<SetStateAction<number>>
  targetSearching: boolean
  targetSearchedRadius: number
  searchOrigin: {
    x: number
    z: number
  } | null
  handlePrevTargetResult: () => void
  handleNextTargetResult: () => void
  handleClearStructureSearch: () => void
}
export function TargetResultsNavigator({
  targetedStructureId,
  targetResultsListOpen,
  setTargetResultsListOpen,
  targetResults,
  targetResultYs,
  targetResultIndex,
  setTargetResultIndex,
  targetSearching,
  targetSearchedRadius,
  searchOrigin,
  handlePrevTargetResult,
  handleNextTargetResult,
  handleClearStructureSearch,
}: TargetResultsNavigatorProps) {
  if (!targetedStructureId) return null
  return (
    <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2">
      {targetResultsListOpen && (
        <div className="bg-background absolute bottom-[calc(100%+6px)] left-1/2 flex max-h-72 w-72 -translate-x-1/2 flex-col overflow-hidden rounded-lg border shadow-md">
          <div className="flex items-center gap-2 border-b p-2">
            <img
              src={STRUCTURE_BY_ID.get(targetedStructureId)?.iconPath}
              alt=""
              className="size-6 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <TooltipProvider>
                <TruncatedLabel
                  text={STRUCTURE_BY_ID.get(targetedStructureId)?.labelPt ?? ''}
                  className="text-sm font-medium"
                />
              </TooltipProvider>
              <div className="text-muted-foreground text-[10px]">
                {targetResults.length} encontradas
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {targetResults.map((r, i) => (
              <button
                key={`${r.x}:${r.z}`}
                type="button"
                onClick={() => setTargetResultIndex(i)}
                className={cn(
                  'hover:bg-muted flex w-full items-center gap-2 border-b px-2 py-1.5 text-left text-xs last:border-b-0',
                  i === targetResultIndex && 'bg-accent',
                )}
              >
                <span className="bg-muted flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-medium">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  X: {r.x}{' '}
                  {targetResultYs.has(`${targetedStructureId}:${r.x}:${r.z}`) &&
                    `Y: ${targetResultYs.get(`${targetedStructureId}:${r.x}:${r.z}`)} `}
                  Z: {r.z}
                </span>
                <span className="text-muted-foreground flex shrink-0 items-center gap-1">
                  {(() => {
                    const originX = searchOrigin?.x ?? 0
                    const originZ = searchOrigin?.z ?? 0
                    const DirectionIcon = getDirectionArrowIcon(
                      r.x - originX,
                      r.z - originZ,
                    )
                    return (
                      <>
                        <DirectionIcon className="size-3" />
                        {formatBlockDistance(
                          Math.hypot(r.x - originX, r.z - originZ),
                        )}
                      </>
                    )
                  })()}
                </span>
              </button>
            ))}
          </div>
          <div className="text-muted-foreground border-t p-1.5 text-center text-[10px]">
            {targetSearching
              ? 'Buscando...'
              : `Buscado até ${formatBlockDistance(targetSearchedRadius)}${targetResults.length >= MAX_TARGET_RESULTS ? ' — limite de busca atingido' : ''}`}
          </div>
        </div>
      )}
      <div className="bg-background flex items-center gap-1 rounded-full border px-1.5 py-1 text-xs shadow-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="size-6"
                disabled={targetResults.length === 0}
                onClick={handlePrevTargetResult}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Resultado anterior</TooltipContent>
          </Tooltip>
          <span className="min-w-[90px] text-center tabular-nums">
            {targetSearching && targetResults.length === 0
              ? 'Buscando...'
              : targetResults.length === 0
                ? 'Nada encontrado'
                : `#${targetResultIndex + 1} / ${targetResults.length}${targetSearching ? '+' : ''} encontradas`}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="size-6"
                disabled={targetResults.length === 0}
                onClick={handleNextTargetResult}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Próximo resultado</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="size-6"
                disabled={targetResults.length === 0}
                onClick={() => setTargetResultsListOpen((v) => !v)}
              >
                {targetResultsListOpen ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronUp className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {targetResultsListOpen ? 'Recolher lista' : 'Expandir lista'}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                className="size-6"
                onClick={handleClearStructureSearch}
              >
                <X className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Sair da busca</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
