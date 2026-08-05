import { Download, Plus, Trash2 } from 'lucide-react'

import { EntityAvatar } from '@/components/common/EntityAvatar'
import {
  EntityContextMenu,
  type ContextMenuAction,
} from '@/components/common/EntityContextMenu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { ModSearchResult } from '@/types/mods'

interface ModBrowserListItemProps {
  result: ModSearchResult
  isSelected: boolean
  isInstalled: boolean
  isViewing: boolean
  onView: (result: ModSearchResult) => void
  onToggleSelection: (result: ModSearchResult) => void
  onDeleteInstalled: (result: ModSearchResult) => void
}

export function ModBrowserListItem({
  result,
  isSelected,
  isInstalled,
  isViewing,
  onView,
  onToggleSelection,
  onDeleteInstalled,
}: ModBrowserListItemProps) {
  const actions: ContextMenuAction[] = isInstalled
    ? [
        {
          key: 'delete',
          icon: Trash2,
          label: 'Remover',
          variant: 'destructive',
          onSelect: () => onDeleteInstalled(result),
        },
      ]
    : [
        {
          key: 'select-latest',
          icon: Plus,
          label: 'Selecionar última versão',
          onSelect: () => onToggleSelection(result),
        },
      ]
  return (
    <EntityContextMenu items={actions}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onView(result)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return
          e.preventDefault()
          onView(result)
        }}
        className={cn(
          'hover:bg-accent focus-visible:ring-ring/50 flex items-center gap-3 rounded-lg p-2 text-left transition-colors outline-none focus-visible:ring-2',
          isViewing && 'bg-primary/10',
          isInstalled && 'opacity-50',
        )}
      >
        <span onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            disabled={isInstalled}
            onCheckedChange={() => onToggleSelection(result)}
          />
        </span>
        <EntityAvatar
          name={result.name}
          iconUrl={result.iconUrl}
          className="size-9"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{result.name}</p>
            {isInstalled && (
              <Badge variant="secondary" className="shrink-0">
                Instalado
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {result.description}
          </p>
        </div>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
          <Download className="size-3" />
          {result.downloads.toLocaleString()}
        </span>
      </div>
    </EntityContextMenu>
  )
}
