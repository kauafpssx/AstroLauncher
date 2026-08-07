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
  ContextMenuItem,
} from '@/components/common/EntityContextMenu'
import { resolvePickerIconPngBase64 } from '@/lib/icon-src'
import { useInstanceStore } from '@/stores/instance.store'
import type { FolderDTO } from '@/types/folder'
import type { InstanceDTO } from '@/types/instance'

import { InstanceWorkspaceAPI } from '../services/instance-workspace.api'

interface InstanceActionHandlers {
  onLaunch: (id: string) => void
  onStop?: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onDuplicate?: (id: string) => void
  onMoveToFolder?: (id: string, folderId: string | null) => void
}

async function openFolder(id: string) {
  try {
    await InstanceWorkspaceAPI.openFolder(id)
  } catch (err) {
    toast.error(`Falha ao abrir pasta: ${String(err)}`)
  }
}

async function toggleShortcut(
  id: string,
  hasShortcut: boolean,
  iconPath: string | null,
) {
  try {
    // Resolved unconditionally: the backend: not `hasShortcut` (zustand
    // state that can lag behind a `.lnk` deleted/created outside the app):
    // is what actually decides whether this call creates or removes the
    // shortcut, based on the real filesystem. Sending `null` here whenever
    // the frontend *assumed* it was a removal risks a shortcut getting
    // created with no icon.
    const iconPngBase64 = await resolvePickerIconPngBase64(iconPath)
    await useInstanceStore.getState().toggleShortcut(id, iconPngBase64)
  } catch (err) {
    toast.error(
      `Falha ao ${hasShortcut ? 'remover' : 'criar'} atalho: ${String(err)}`,
    )
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
    onDuplicate,
    onMoveToFolder,
  }: InstanceActionHandlers,
  isRunning = false,
  folders: FolderDTO[] = [],
  hasShortcut = false,
): ContextMenuItem[] {
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

  const items: ContextMenuItem[] = [
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
      key: 'move-to-folder',
      icon: Folder,
      label: 'Mover para Pasta',
      items: moveItems,
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
      onSelect: () => onDuplicate?.(instance.id),
    },
    {
      key: 'shortcut',
      icon: Link2,
      label: hasShortcut ? 'Remover Atalho' : 'Criar Atalho',
      onSelect: () =>
        toggleShortcut(instance.id, hasShortcut, instance.iconPath),
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

  return items
}
