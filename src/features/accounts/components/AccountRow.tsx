import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

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
import { CustomIconAPI } from '@/features/instances/services/custom-icon.api'
import { resolveIconSrc } from '@/lib/icon-src'
import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'
import type { AccountDTO } from '@/types/account'

import { SkinHeadPickerDialog } from './SkinHeadPickerDialog'

interface AccountRowProps {
  account: AccountDTO
  onSetDefault: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateIcon: (iconPath: string) => void
}

export function AccountRow({
  account,
  onSetDefault,
  onEdit,
  onDelete,
  onUpdateIcon,
}: AccountRowProps) {
  const [skinPickerOpen, setSkinPickerOpen] = useState(false)
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id })

  const handlePickHead = async (base64Png: string) => {
    try {
      const saved = await CustomIconAPI.save(base64Png)
      onUpdateIcon(saved.path)
    } catch (err) {
      toast.error(`Falha ao salvar avatar: ${String(err)}`)
    }
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab touch-none active:cursor-grabbing',
        account.isDefault && 'bg-primary/5',
        isDragging && 'bg-muted relative z-10 border-b-0 shadow-md',
      )}
    >
      <TableCell>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSkinPickerOpen(true)}
            className="shrink-0 rounded-md"
            {...tooltipProps('Escolher avatar a partir de uma skin')}
          >
            <EntityAvatar
              name={account.username}
              iconUrl={resolveIconSrc(account.iconPath)}
              className="size-6"
              fallbackClassName="text-[10px]"
            />
          </button>
          <button
            type="button"
            onClick={onSetDefault}
            className="flex items-center gap-2.5 text-left"
            {...tooltipProps('Definir como padrão')}
          >
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                account.isDefault
                  ? 'border-primary'
                  : 'border-muted-foreground',
              )}
            >
              {account.isDefault && (
                <span className="bg-primary size-2 rounded-full" />
              )}
            </span>
            <span className="font-medium">{account.username}</span>
          </button>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {account.accountType}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">Pronta</Badge>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Mais opções"
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

      <SkinHeadPickerDialog
        open={skinPickerOpen}
        onOpenChange={setSkinPickerOpen}
        onPick={handlePickHead}
      />
    </TableRow>
  )
}
