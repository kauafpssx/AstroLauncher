import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { STRUCTURE_LIST } from '@/data/structure-metadata'
import { TruncatedLabel } from './TruncatedLabel'
export function StructureRow({
  structure,
  checked,
  onCheckedChange,
}: {
  structure: (typeof STRUCTURE_LIST)[number]
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-xs">
      <Tooltip>
        <TooltipTrigger asChild>
          <img
            src={structure.iconPath}
            alt=""
            className="size-5 shrink-0 cursor-help"
          />
        </TooltipTrigger>
        <TooltipContent side="left">
          <img
            src={structure.basePath}
            alt={structure.labelPt}
            className="size-32 object-contain"
          />
        </TooltipContent>
      </Tooltip>
      <TruncatedLabel text={structure.labelPt} />
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
    </label>
  )
}
