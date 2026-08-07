import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import { useImportAstropackStore } from '@/stores/import-astropack.store'
import { useInstanceStore, useSelectedInstance } from '@/stores/instance.store'
import type { SettingsDTO } from '@/types/settings'

import { useFolderHandlers } from './useFolderHandlers'
import { useInstances } from './useInstances'
import { useLaunchInstance } from './useLaunchInstance'

/** Estado, dados e handlers da página de instâncias (CRUD de instâncias e
 * pastas, import/export, ícone e nome do grupo raiz). */
export function useInstancesPage() {
  const navigate = useNavigate()
  const { instances, deleteInstance, refresh } = useInstances()
  const duplicateInstance = useInstanceStore((s) => s.duplicateInstance)
  const selectedInstance = useSelectedInstance()
  const selectInstance = useInstanceStore((s) => s.selectInstance)
  const reorderInstances = useInstanceStore((s) => s.reorderInstances)
  const { launch, stop, runningId } = useLaunchInstance()
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [exportTargetId, setExportTargetId] = useState<string | null>(null)
  const [importFilePath, setImportFilePath] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsDTO | null>(null)
  const pendingImportPath = useImportAstropackStore((s) => s.pendingPath)
  const clearPendingImportPath = useImportAstropackStore((s) => s.clearPending)

  const {
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
  } = useFolderHandlers({
    settings,
    setSettings,
    refreshInstances: refresh,
  })

  useDiscordPresence('AstroLauncher', `${instances.length} instâncias`)

  useEffect(() => {
    SettingsAPI.get()
      .then(setSettings)
      .catch(() => {})
  }, [])

  // Opened via the `.astropack` file association (cold start or a second
  // launch attempt forwarded while already running): adjusted during
  // render rather than in an effect, same as the reset patterns elsewhere.
  const [prevPendingImportPath, setPrevPendingImportPath] =
    useState(pendingImportPath)
  if (prevPendingImportPath !== pendingImportPath) {
    setPrevPendingImportPath(pendingImportPath)
    if (pendingImportPath) {
      setImportFilePath(pendingImportPath)
      clearPendingImportPath()
    }
  }

  const rootGroupName = settings?.rootGroupName?.trim() || 'Todas as Instâncias'
  const rootGroupIcon = settings?.rootGroupIcon ?? null

  const deleteTarget = instances.find((i) => i.id === deleteTargetId) ?? null
  const exportTarget = instances.find((i) => i.id === exportTargetId) ?? null

  const handleEdit = (id: string) => navigate(`/instances/${id}/edit`)

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateInstance(id)
      toast.success('Instância duplicada')
    } catch (err) {
      toast.error(`Falha ao duplicar: ${String(err)}`)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    try {
      await deleteInstance(deleteTargetId)
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
    handleDuplicate,
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
