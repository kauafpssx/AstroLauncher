import { KeyRound } from 'lucide-react'

import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { tooltipProps } from '@/lib/tooltip'
import type {
  McstatSortBy,
  PlayerMcSortBy,
  SkinModel,
  SkinSortBy,
  SkinSource,
} from '@/types/skins'

const SOURCES: { id: SkinSource; label: string; icon: string }[] = [
  { id: 'playermc', label: 'PlayerMC', icon: '/skins/playermc.ico' },
  { id: 'mcstat', label: 'MCStat', icon: '/skins/mcstat.ico' },
]

const PLAYERMC_SORTS: { value: PlayerMcSortBy; label: string }[] = [
  { value: 'popular-desc', label: 'Mais populares' },
  { value: 'popular-asc', label: 'Menos populares' },
]

const MCSTAT_SORTS: { value: McstatSortBy; label: string }[] = [
  { value: 'popular', label: 'Populares' },
  { value: 'trending', label: 'Em alta' },
  { value: 'recent', label: 'Recentes' },
]

const MODEL_FILTERS: { value: 'all' | SkinModel; label: string }[] = [
  { value: 'all', label: 'Todos os modelos' },
  { value: 'classic', label: 'Classic' },
  { value: 'slim', label: 'Slim' },
]

const SORTS_BY_SOURCE: Record<
  SkinSource,
  { value: SkinSortBy; label: string }[]
> = {
  playermc: PLAYERMC_SORTS,
  mcstat: MCSTAT_SORTS,
}

interface SkinsToolbarProps {
  source: SkinSource
  sortBy: SkinSortBy
  setSortBy: (value: SkinSortBy) => void
  model: 'all' | SkinModel
  setModel: (value: 'all' | SkinModel) => void
  query: string
  setQuery: (value: string) => void
  onSourceChange: (source: SkinSource) => void
  onOpenKeyDialog: () => void
}

export function SkinsToolbar({
  source,
  sortBy,
  setSortBy,
  model,
  setModel,
  query,
  setQuery,
  onSourceChange,
  onOpenKeyDialog,
}: SkinsToolbarProps) {
  return (
    <>
      <SearchInput
        containerClassName="ml-4 w-full max-w-xs"
        placeholder="Pesquisar por nome de jogador..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SkinSortBy)}>
        <SelectTrigger size="sm" className="ml-auto w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORTS_BY_SOURCE[source].map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {source === 'mcstat' && (
        <Select
          value={model}
          onValueChange={(v) => setModel(v as 'all' | SkinModel)}
        >
          <SelectTrigger size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_FILTERS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <ToggleGroup
        type="single"
        value={source}
        onValueChange={(v) => v && onSourceChange(v as SkinSource)}
      >
        {SOURCES.map((s) => (
          <ToggleGroupItem key={s.id} value={s.id}>
            <img src={s.icon} alt="" className="size-4" /> {s.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {source === 'mcstat' && (
        <Button
          variant="ghost"
          size="icon"
          {...tooltipProps('Alterar chave de API do MCStat')}
          onClick={onOpenKeyDialog}
        >
          <KeyRound />
        </Button>
      )}
    </>
  )
}
