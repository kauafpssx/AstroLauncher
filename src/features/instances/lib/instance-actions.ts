import { Copy, Download, Folder, FolderOpen, Link2, Pencil, Play, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { ContextMenuAction } from '@/components/common/EntityContextMenu'
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
  { onLaunch, onStop, onEdit, onDelete, onExport }: InstanceActionHandlers,
  isRunning = false,
): ContextMenuAction[] {
  return [
    isRunning
      ? { key: 'stop', icon: Square, label: 'Encerrar', onSelect: () => onStop?.(instance.id) }
      : { key: 'launch', icon: Play, label: 'Iniciar', onSelect: () => onLaunch(instance.id) },
    { key: 'edit', icon: Pencil, label: 'Editar', onSelect: () => onEdit(instance.id), separatorBefore: true },
    { key: 'group', icon: Folder, label: 'Grupo', onSelect: notImplemented },
    { key: 'open-folder', icon: FolderOpen, label: 'Abrir Pasta', onSelect: () => openFolder(instance.id) },
    { key: 'export', icon: Download, label: 'Exportar', onSelect: () => onExport(instance.id) },
    { key: 'duplicate', icon: Copy, label: 'Duplicar', onSelect: notImplemented },
    { key: 'shortcut', icon: Link2, label: 'Criar Atalho', onSelect: notImplemented },
    {
      key: 'delete',
      icon: Trash2,
      label: 'Excluir',
      onSelect: () => onDelete(instance.id),
      variant: 'destructive',
      separatorBefore: true,
    },
  ]
}
