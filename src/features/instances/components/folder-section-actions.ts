import { FolderPlus, Image, Pencil, Trash2 } from 'lucide-react'

import { type ContextMenuAction } from '@/components/common/EntityContextMenu'

interface FolderHeaderActionHandlers {
  onCreateFolder: () => void
  onRename: () => void
  onPickIcon: () => void
  onDelete: () => void
}

export function buildFolderHeaderActions({
  onCreateFolder,
  onRename,
  onPickIcon,
  onDelete,
}: FolderHeaderActionHandlers): ContextMenuAction[] {
  return [
    {
      key: 'new-folder',
      icon: FolderPlus,
      label: 'Nova Pasta',
      onSelect: onCreateFolder,
    },
    { key: 'rename', icon: Pencil, label: 'Renomear', onSelect: onRename },
    {
      key: 'icon',
      icon: Image,
      label: 'Escolher Ícone',
      onSelect: onPickIcon,
    },
    {
      key: 'delete',
      icon: Trash2,
      label: 'Excluir Pasta',
      onSelect: onDelete,
      variant: 'destructive',
      separatorBefore: true,
    },
  ]
}
