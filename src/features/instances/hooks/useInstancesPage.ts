import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import { useFolderStore } from '@/stores/folder.store'
import { useInstanceStore, useSelectedInstance } from '@/stores/instance.store'
import type { FolderDTO } from '@/types/folder'
import type { SettingsDTO } from '@/types/settings'

import { useFolders } from './useFolders'
import { useInstances } from './useInstances'
import { useLaunchInstance } from './useLaunchInstance'

export interface FolderDialogState {
  mode: 'create' | 'rename'
  folderId?: string
  initialName?: string
  isRoot?: boolean
}

/** Estado, dados e handlers da página de instâncias (CRUD de instâncias e
 * pastas, import/export, ícone e nome do grupo raiz). */
export function useInstancesPage() {
  const navigate = useNavigate()
  const { instances, deleteInstance, refresh } = useInstances()
  const { folders, refresh: refreshFolders } = useFolders()
  const selectedInstance = useSelectedInstance()
  const selectInstance = useInstanceStore((s) => s.selectInstance)
  const moveInstance = useInstanceStore((s) => s.moveInstance)
  const reorderInstances = useInstanceStore((s) => s.reorderInstances)
  const createFolder = useFolderStore((s) => s.createFolder)
  const updateFolder = useFolderStore((s) => s.updateFolder)
  const deleteFolder = useFolderStore((s) => s.deleteFolder)
  const reorderFolders = useFolderStore((s) => s.reorderFolders)
  const setCollapsed = useFolderStore((s) => s.setCollapsed)
  const { launch, stop, runningId } = useLaunchInstance()
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [exportTargetId, setExportTargetId] = useState<string | null>(null)
  const [importFilePath, setImportFilePath] = useState<string | null>(null)
  const [folderDialog, setFolderDialog] = useState<FolderDialogState | null>(
    null,
  )
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<FolderDTO | null>(null)
  const [settings, setSettings] = useState<SettingsDTO | null>(null)

  useDiscordPresence('AstroLauncher', `${instances.length} instâncias`)

  useEffect(() => {
    SettingsAPI.get()
      .then(setSettings)
      .catch(() => {})
  }, [])

  const rootGroupName = settings?.rootGroupName?.trim() || 'Todas as Instâncias'
  const rootGroupIcon = settings?.rootGroupIcon ?? null

  const deleteTarget = instances.find((i) => i.id === deleteTargetId) ?? null
  const exportTarget = instances.find((i) => i.id === exportTargetId) ?? null

  const handleEdit = (id: string) => navigate(`/instances/${id}/edit`)

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      await deleteInstance(deleteTargetId)
      toast.success('Instância excluída')
    } catch (err) {
      toast.error(`Falha ao excluir: ${String(err)}`)
    } finally {
      setDeleteTargetId(null)
    }
  }

  const handleImport = async () => {
    const filePath = await openFileDialog({
      multiple: false,
      filters: [{ name: 'AstroPack', extensions: ['astropack'] }],
    })
    if (!filePath || Array.isArray(filePath)) return
    setImportFilePath(filePath)
  }

  const handleCreateFolder = async (name: string) => {
    try {
      await createFolder({ name })
      toast.success('Pasta criada')
    } catch (err) {
      toast.error(`Falha ao criar pasta: ${String(err)}`)
      throw err
    }
  }

  const handlePickRootIcon = async (iconPath: string) => {
    try {
      const updated = await SettingsAPI.update({
        curseforgeApiKey: settings?.curseforgeApiKey ?? null,
        mcstatApiKey: settings?.mcstatApiKey ?? null,
        rootGroupName: settings?.rootGroupName ?? null,
        rootGroupIcon: iconPath,
      })
      setSettings(updated)
    } catch (err) {
      toast.error(`Falha ao atualizar ícone: ${String(err)}`)
    }
  }

  const handleRenameFolder = async (name: string) => {
    if (!folderDialog) return
    if (folderDialog.isRoot) {
      try {
        const updated = await SettingsAPI.update({
          curseforgeApiKey: settings?.curseforgeApiKey ?? null,
          mcstatApiKey: settings?.mcstatApiKey ?? null,
          rootGroupName: name,
        })
        setSettings(updated)
        toast.success('Grupo renomeado')
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
      toast.success('Pasta renomeada')
    } catch (err) {
      toast.error(`Falha ao renomear pasta: ${String(err)}`)
      throw err
    }
  }

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return
    try {
      await deleteFolder(deleteFolderTarget.id)
      toast.success('Pasta excluída')
      await refresh()
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

  const handleReorderInstances = (orderedIds: string[]) =>
    reorderInstances(orderedIds).catch(() =>
      toast.error('Falha ao reordenar instâncias'),
    )

  const refreshAll = () => {
    refresh()
    refreshFolders()
  }

  return {
    navigate,
    instances,
    folders,
    selectedInstance,
    selectInstance,
    runningId,
    launch,
    stop,
    rootGroupName,
    rootGroupIcon,
    deleteTarget,
    deleteTargetId,
    setDeleteTargetId,
    exportTarget,
    exportTargetId,
    setExportTargetId,
    importFilePath,
    setImportFilePath,
    folderDialog,
    setFolderDialog,
    deleteFolderTarget,
    setDeleteFolderTarget,
    refresh,
    refreshAll,
    handleEdit,
    handleImport,
    confirmDelete,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handlePickRootIcon,
    handleToggleCollapsed,
    handleMoveToFolder,
    handleReorderFolders,
    handleReorderInstances,
  }
}
