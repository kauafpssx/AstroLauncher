import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  onRefresh: () => void
}

export function FiltersCard({ typeFilters, onChange, onRefresh }: FiltersCardProps) {
  const toggle = (value: VersionType, checked: boolean) => {
    onChange(checked ? [...typeFilters, value] : typeFilters.filter((v) => v !== value))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {FILTERS.map((filter) => (
          <label key={filter.value} className="flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={typeFilters.includes(filter.value)}
              onCheckedChange={(checked) => toggle(filter.value, checked === true)}
            />
            {filter.label}
          </label>
        ))}

        <Button variant="outline" size="sm" className="mt-2" onClick={onRefresh}>
          <RefreshCw /> Atualizar versões
        </Button>
      </CardContent>
    </Card>
  )
}
