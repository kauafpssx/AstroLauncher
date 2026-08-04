import {
  Copy,
  Download,
  Folder,
  FolderOpen,
  FolderX,
  Link2,
  Pencil,
  Play,
  Square,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import type {
  ContextMenuAction,
  ContextMenuSubmenu,
} from '@/components/common/EntityContextMenu'
import type { FolderDTO } from '@/types/folder'
import type { InstanceDTO } from '@/types/instance'

import { InstanceWorkspaceAPI } from '../services/instance-workspace.api'

function notImplemented() {
  // placeholder for future actions
}

interface InstanceActionHandlers {
  onLaunch: (id: string) => void
  onStop?: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onMoveToFolder?: (id: string, folderId: string | null) => void
}

async function openFolder(id: string) {
  try {
    await InstanceWorkspaceAPI.openFolder(id)
  } catch (err) {
    toast.error(`Falha ao abrir pasta: ${String(err)}`)
  }
}

export function getInstanceActions(
  instance: InstanceDTO,
  {
    onLaunch,
    onStop,
    onEdit,
    onDelete,
    onExport,
    onMoveToFolder,
  }: InstanceActionHandlers,
  isRunning = false,
  folders: FolderDTO[] = [],
): { actions: ContextMenuAction[]; submenus: ContextMenuSubmenu[] } {
  const moveItems: ContextMenuAction[] = [
    ...folders.map((folder) => ({
      key: `move-${folder.id}`,
      icon: Folder,
      label: folder.name,
      onSelect: () => onMoveToFolder?.(instance.id, folder.id),
    })),
    {
      key: 'move-root',
      icon: FolderX,
      label: 'Todas as Instâncias',
      onSelect: () => onMoveToFolder?.(instance.id, null),
      separatorBefore: folders.length > 0,
    },
  ]

  const submenus: ContextMenuSubmenu[] = [
    {
      key: 'move-to-folder',
      icon: Folder,
      label: 'Mover para Pasta',
      items: moveItems,
    },
  ]

  const actions: ContextMenuAction[] = [
    isRunning
      ? {
          key: 'stop',
          icon: Square,
          label: 'Encerrar',
          onSelect: () => onStop?.(instance.id),
        }
      : {
          key: 'launch',
          icon: Play,
          label: 'Iniciar',
          onSelect: () => onLaunch(instance.id),
        },
    {
      key: 'edit',
      icon: Pencil,
      label: 'Editar',
      onSelect: () => onEdit(instance.id),
      separatorBefore: true,
    },
    {
      key: 'open-folder',
      icon: FolderOpen,
      label: 'Abrir Pasta',
      onSelect: () => openFolder(instance.id),
    },
    {
      key: 'export',
      icon: Download,
      label: 'Exportar',
      onSelect: () => onExport(instance.id),
    },
    {
      key: 'duplicate',
      icon: Copy,
      label: 'Duplicar',
      onSelect: notImplemented,
    },
    {
      key: 'shortcut',
      icon: Link2,
      label: 'Criar Atalho',
      onSelect: notImplemented,
    },
    {
      key: 'delete',
      icon: Trash2,
      label: 'Excluir',
      onSelect: () => onDelete(instance.id),
      variant: 'destructive',
      separatorBefore: true,
    },
  ]

  return { actions, submenus }
}
