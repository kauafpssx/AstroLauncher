import { Checkbox } from '@/components/ui/checkbox'
import type { BiomePaletteEntry } from '@/types/seed-map'
import { TruncatedLabel } from './TruncatedLabel'
export function BiomeHighlightRow({
  entry,
  displayName,
  checked,
  onCheckedChange,
}: {
  entry: BiomePaletteEntry
  displayName: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-xs">
      <span
        className="size-3 shrink-0 rounded-sm border"
        style={{ backgroundColor: entry.colorHex }}
      />
      <TruncatedLabel text={displayName} />
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
    </label>
  )
}
