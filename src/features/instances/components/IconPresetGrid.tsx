import { useMemo } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MC_BLOCK_ICONS } from '@/data/mc-icons'
import { tooltipProps } from '@/lib/tooltip'

interface IconPresetGridProps {
  icons: typeof MC_BLOCK_ICONS
  search: string
  onPick: (path: string) => void
}

export function IconPresetGrid({ icons, search, onPick }: IconPresetGridProps) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return icons
    return icons.filter((icon) => icon.label.toLowerCase().includes(q))
  }, [icons, search])

  return (
    <ScrollArea className="h-72">
      <div className="grid grid-cols-6 gap-2 pr-3">
        {filtered.map((icon) => (
          <button
            key={icon.id}
            type="button"
            {...tooltipProps(icon.label)}
            onClick={() => onPick(icon.path)}
            className="bg-muted hover:border-primary hover:bg-accent flex aspect-square items-center justify-center rounded-md border border-transparent p-2 transition-colors"
          >
            <img
              src={icon.path}
              alt={icon.label}
              loading="lazy"
              className="size-full [image-rendering:pixelated]"
            />
          </button>
        ))}
        {filtered.length === 0 && (
          <EmptyState
            title="Nenhum ícone encontrado."
            className="col-span-6 p-4"
          />
        )}
      </div>
    </ScrollArea>
  )
}
