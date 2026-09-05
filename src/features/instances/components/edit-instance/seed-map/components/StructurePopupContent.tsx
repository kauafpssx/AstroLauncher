import { Check, Copy } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { BIOME_METADATA } from '@/data/biome-metadata'
import type { StructureVariant } from '@/types/seed-map'
const BASTION_TYPE_LABELS_PT: Record<string, string> = {
  housing: 'Alojamento',
  hoglin_stable: 'Estábulo de Hoglin',
  treasure: 'Câmara do Tesouro',
  bridge: 'Ponte',
}
function biomeLabelPt(name: string): string {
  return BIOME_METADATA[name]?.labelPt ?? name
}
function getVariantDetails(
  structureId: string,
  variant: StructureVariant | null,
): string[] {
  if (!variant) return []
  const details: string[] = []
  switch (structureId) {
    case 'village':
      if (variant.villageBiome)
        details.push(`Estilo: ${biomeLabelPt(variant.villageBiome)}`)
      if (variant.abandoned) details.push('Aldeia abandonada (zumbis)')
      break
    case 'bastion-remnant':
      if (variant.bastionType)
        details.push(
          `Tipo: ${BASTION_TYPE_LABELS_PT[variant.bastionType] ?? variant.bastionType}`,
        )
      break
    case 'ruined-portal':
    case 'ruined-portal-nether': {
      const parts: string[] = []
      if (variant.ruinedPortalBiome)
        parts.push(biomeLabelPt(variant.ruinedPortalBiome))
      if (variant.ruinedPortalGiant) parts.push('gigante')
      if (variant.ruinedPortalUnderground) parts.push('subterrâneo')
      if (variant.ruinedPortalAirPocket) parts.push('com bolsão de ar')
      if (parts.length > 0) details.push(parts.join(' '))
      break
    }
    case 'igloo':
      details.push(
        variant.iglooHasBasement
          ? 'Tem porão (laboratório da bruxa)'
          : 'Sem porão',
      )
      break
    case 'amethyst-geode':
      if (variant.geodeCracked) details.push('Rachado')
      break
  }
  return details
}
export function StructurePopupContent({
  popup,
  variant,
  meta,
  isSlimeChunk,
  coordsCopied,
  onCopyCoords,
  targetedStructureId,
  searchOrigin,
  onToggleCompleted,
}: {
  popup: {
    structureId: string
    x: number
    z: number
    y: number | null
    completed: boolean
  }
  variant: StructureVariant | null
  meta:
    | {
        labelPt: string
        basePath: string
      }
    | undefined
  isSlimeChunk: boolean
  coordsCopied: boolean
  onCopyCoords: () => void
  targetedStructureId: string | null
  searchOrigin: {
    x: number
    z: number
  } | null
  onToggleCompleted: (completed: boolean) => void
}) {
  const variantDetails = getVariantDetails(popup.structureId, variant)
  return (
    <div className="pointer-events-auto relative max-w-sm min-w-[180px]">
      <div className="bg-background overflow-hidden rounded-lg border shadow-md">
        <img src={meta?.basePath} alt="" className="h-40 w-full object-cover" />
        <div className="p-2.5">
          <div className="mb-1.5 text-center text-sm font-medium">
            {meta?.labelPt ?? popup.structureId}
          </div>
          <div className="text-muted-foreground mb-1.5 flex flex-col items-center text-xs">
            <div className="flex items-center gap-1.5">
              <span>
                X: {popup.x} {popup.y !== null && `Y: ${popup.y} `}Z: {popup.z}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onCopyCoords}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {coordsCopied ? (
                        <Check className="size-3 text-green-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Copiar coordenadas</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {popup.structureId === targetedStructureId && searchOrigin && (
              <div>
                {Math.round(
                  Math.hypot(
                    popup.x - searchOrigin.x,
                    popup.z - searchOrigin.z,
                  ),
                ).toLocaleString()}{' '}
                blocos de distância
              </div>
            )}
          </div>
          {variantDetails.length > 0 && (
            <div className="text-muted-foreground mb-1.5 flex flex-col items-center gap-0.5 text-xs">
              {variantDetails.map((detail) => (
                <div key={detail}>{detail}</div>
              ))}
            </div>
          )}
          {!isSlimeChunk && (
            <>
              <Separator className="mb-1.5" />
              <label className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={popup.completed}
                  onCheckedChange={(v) => onToggleCompleted(v === true)}
                />
                Completo
              </label>
            </>
          )}
        </div>
      </div>
      <div className="bg-background absolute top-full left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b" />
    </div>
  )
}
