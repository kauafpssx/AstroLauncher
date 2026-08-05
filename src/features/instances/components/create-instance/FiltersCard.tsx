import { Checkbox } from '@/components/ui/checkbox'
import type { VersionType } from '@/types/version'

const FILTERS: { value: VersionType; label: string }[] = [
  { value: 'release', label: 'Releases' },
  { value: 'snapshot', label: 'Snapshots' },
  { value: 'old_beta', label: 'Betas' },
  { value: 'old_alpha', label: 'Alphas' },
]

interface FiltersCardProps {
  typeFilters: VersionType[]
  onChange: (filters: VersionType[]) => void
}

export function FiltersCard({ typeFilters, onChange }: FiltersCardProps) {
  const toggle = (value: VersionType, checked: boolean) => {
    if (!checked && typeFilters.length === 1) return
    onChange(
      checked
        ? [...typeFilters, value]
        : typeFilters.filter((v) => v !== value),
    )
  }

  return (
    <div className="flex flex-col gap-3 border-t pt-4">
      <h3 className="text-sm font-medium">Filtros</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
        {FILTERS.map((filter) => (
          <label
            key={filter.value}
            className="flex items-center gap-2.5 text-sm"
          >
            <Checkbox
              checked={typeFilters.includes(filter.value)}
              onCheckedChange={(checked) =>
                toggle(filter.value, checked === true)
              }
            />
            {filter.label}
          </label>
        ))}
      </div>
    </div>
  )
}
