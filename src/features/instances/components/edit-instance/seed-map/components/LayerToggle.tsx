import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { TruncatedLabel } from './TruncatedLabel'
export function LayerToggle({
  label,
  iconPath,
  basePath,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string
  iconPath: string
  basePath: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={cn(
        'flex min-w-0 items-center gap-2 text-xs',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <img src={iconPath} alt="" className="size-5 shrink-0 cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="left">
          <img src={basePath} alt={label} className="size-32 object-contain" />
        </TooltipContent>
      </Tooltip>
      <TruncatedLabel text={label} />
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
      />
    </label>
  )
}
