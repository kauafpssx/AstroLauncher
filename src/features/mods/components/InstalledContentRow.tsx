import { Trash2 } from 'lucide-react'

import { EntityAvatar } from '@/components/common/EntityAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { tooltipProps } from '@/lib/tooltip'
import type { InstalledMod } from '@/types/mods'

import { SOURCE_LOGO } from './installed-content-tab.constants'

interface InstalledContentRowProps {
  item: InstalledMod
  isSelected: boolean
  onToggleSelected: (id: string) => void
  onToggleEnabled: (item: InstalledMod, enabled: boolean) => void
  onDelete: (item: InstalledMod) => void
}

export function InstalledContentRow({
  item,
  isSelected,
  onToggleSelected,
  onToggleEnabled,
  onDelete,
}: InstalledContentRowProps) {
  return (
    <TableRow
      data-state={isSelected ? 'selected' : undefined}
      onClick={() => onToggleSelected(item.id)}
      onKeyDown={(e) => {
        // Only respond when the row itself has focus: Enter/Space on inner
        // controls (switch, buttons) bubbles up here.
        if (e.target !== e.currentTarget) return
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        onToggleSelected(item.id)
      }}
      tabIndex={0}
      className={cn(
        'focus-visible:ring-ring/50 cursor-pointer outline-none focus-visible:ring-2',
        !item.enabled && 'opacity-50',
      )}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => onToggleSelected(item.id)}
          aria-label={`Selecionar ${item.name}`}
        />
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2.5">
          <EntityAvatar
            name={item.name}
            iconUrl={item.iconUrl}
            className="size-7"
            fallbackClassName="text-[10px]"
          />
          {item.name}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {SOURCE_LOGO[item.source] && (
            <img src={SOURCE_LOGO[item.source]} alt="" className="size-3" />
          )}
          {item.source}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{item.version}</TableCell>
      <TableCell>
        <Switch
          checked={item.enabled}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(checked) => onToggleEnabled(item, checked)}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item)
          }}
          aria-label="Excluir"
          {...tooltipProps('Excluir')}
        >
          <Trash2 className="text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
