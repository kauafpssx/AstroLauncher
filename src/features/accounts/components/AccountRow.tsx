import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { EntityAvatar } from '@/components/common/EntityAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TableCell, TableRow } from '@/components/ui/table'
import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'
import type { AccountDTO } from '@/types/account'

interface AccountRowProps {
  account: AccountDTO
  onSetDefault: () => void
  onEdit: () => void
  onDelete: () => void
}

export function AccountRow({
  account,
  onSetDefault,
  onEdit,
  onDelete,
}: AccountRowProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id })

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'cursor-default',
        account.isDefault && 'bg-primary/5',
        isDragging && 'bg-muted relative z-10 border-b-0 shadow-md',
      )}
    >
      <TableCell>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground flex cursor-grab touch-none items-center active:cursor-grabbing"
          {...tooltipProps('Arrastar para reordenar')}
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      <TableCell>
        <button
          type="button"
          onClick={onSetDefault}
          className="flex items-center gap-2.5 text-left"
          {...tooltipProps('Definir como padrão')}
        >
          <span
            className={cn(
              'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
              account.isDefault ? 'border-primary' : 'border-muted-foreground',
            )}
          >
            {account.isDefault && (
              <span className="bg-primary size-2 rounded-full" />
            )}
          </span>
          <EntityAvatar
            name={account.username}
            className="size-6"
            fallbackClassName="text-[10px]"
          />
          <span className="font-medium">{account.username}</span>
        </button>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {account.accountType}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">Pronta</Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              {...tooltipProps('Mais opções')}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
