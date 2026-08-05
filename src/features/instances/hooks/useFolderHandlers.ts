import { useState } from 'react'
import { toast } from 'sonner'

import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useFolderStore } from '@/stores/folder.store'
import { useInstanceStore } from '@/stores/instance.store'
import type { FolderDTO } from '@/types/folder'
import type { SettingsDTO } from '@/types/settings'

import { useFolders } from './useFolders'

export interface FolderDialogState {
  mode: 'create' | 'rename'
  folderId?: string
  initialName?: string
  isRoot?: boolean
}

interface UseFolderHandlersArgs {
  settings: SettingsDTO | null
  setSettings: (settings: SettingsDTO) => void
  refreshInstances: () => Promise<void> | void
}

/** Estado e handlers das pastas (criar, renomear, excluir, colapsar, mover e
 * reordenar), extraídos de `useInstancesPage`. */
export function useFolderHandlers({
  settings,
  setSettings,
  refreshInstances,
}: UseFolderHandlersArgs) {
  const { folders, refresh: refreshFolders } = useFolders()
  const moveInstance = useInstanceStore((s) => s.moveInstance)
  const createFolder = useFolderStore((s) => s.createFolder)
  const updateFolder = useFolderStore((s) => s.updateFolder)
  const deleteFolder = useFolderStore((s) => s.deleteFolder)
  const reorderFolders = useFolderStore((s) => s.reorderFolders)
  const setCollapsed = useFolderStore((s) => s.setCollapsed)
  const [folderDialog, setFolderDialog] = useState<FolderDialogState | null>(
    null,
  )
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<FolderDTO | null>(null)

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder({ name })
    } catch (err) {
      toast.error(`Falha ao criar pasta: ${String(err)}`)
      throw err
    }
  }

  const handleRenameFolder = async (name: string) => {
    if (!folderDialog) return
    if (folderDialog.isRoot) {
      // Sem settings carregado, `?? null` sobrescreveria as chaves de API
      // persistidas com null e apagaria as credenciais do usuário.
      if (!settings) {
        toast.error('Configurações ainda carregando, tente novamente')
        return
      }
      try {
        const updated = await SettingsAPI.update({
          curseforgeApiKey: settings.curseforgeApiKey,
          mcstatApiKey: settings.mcstatApiKey,
          rootGroupName: name,
        })
        setSettings(updated)
      } catch (err) {
        toast.error(`Falha ao renomear grupo: ${String(err)}`)
        throw err
      }
      return
    }
    const folder = folders.find((f) => f.id === folderDialog.folderId)
    try {
      await updateFolder({
        id: folderDialog.folderId!,
        name,
        collapsed: folder?.collapsed ?? false,
      })
    } catch (err) {
      toast.error(`Falha ao renomear pasta: ${String(err)}`)
      throw err
    }
  }

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return
    try {
      await deleteFolder(deleteFolderTarget.id)
      await refreshInstances()
    } catch (err) {
      toast.error(`Falha ao excluir pasta: ${String(err)}`)
    } finally {
      setDeleteFolderTarget(null)
    }
  }

  const handleToggleCollapsed = async (
    folderId: string,
    collapsed: boolean,
  ) => {
    try {
      await setCollapsed(folderId, collapsed)
    } catch (err) {
      toast.error(`Falha ao atualizar pasta: ${String(err)}`)
    }
  }

  const handleMoveToFolder = async (
    instanceId: string,
    folderId: string | null,
  ) => {
    const target = folderId ? folders.find((f) => f.id === folderId) : null
    try {
      await moveInstance(instanceId, folderId)
      if (target?.collapsed) {
        await setCollapsed(target.id, false)
      }
    } catch (err) {
      toast.error(`Falha ao mover instância: ${String(err)}`)
    }
  }

  const handleReorderFolders = (orderedIds: string[]) =>
    reorderFolders(orderedIds).catch(() =>
      toast.error('Falha ao reordenar pastas'),
    )

  return {
    folders,
    refreshFolders,
    folderDialog,
    setFolderDialog,
    deleteFolderTarget,
    setDeleteFolderTarget,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleToggleCollapsed,
    handleMoveToFolder,
    handleReorderFolders,
  }
}
