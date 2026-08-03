import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Shell } from '@/components/layout/Shell'
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'
import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import { useFolderStore } from '@/stores/folder.store'
import { useInstanceStore, useSelectedInstance } from '@/stores/instance.store'
import type { FolderDTO } from '@/types/folder'
import type { SettingsDTO } from '@/types/settings'

import { ConfirmDeleteFolderDialog } from '../components/ConfirmDeleteFolderDialog'
import { DeleteInstanceDialog } from '../components/DeleteInstanceDialog'
import { ExportAstropackDialog } from '../components/ExportAstropackDialog'
import { FolderNameDialog } from '../components/FolderNameDialog'
import { ImportAstropackDialog } from '../components/ImportAstropackDialog'
import { InstanceGrid } from '../components/InstanceGrid'
import { InstanceSidebar } from '../components/InstanceSidebar'
import { useFolders } from '../hooks/useFolders'
import { useInstances } from '../hooks/useInstances'
import { useLaunchInstance } from '../hooks/useLaunchInstance'

interface FolderDialogState {
  mode: 'create' | 'rename'
  folderId?: string
  initialName?: string
  isRoot?: boolean
}

export function InstancesPage() {
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

  return (
    <Shell
      topBar={
        <TopBar
          onCreateInstance={() => navigate('/instances/new')}
          onImportInstance={handleImport}
        />
      }
      statusBar={<StatusBar instanceCount={instances.length} />}
    >
      <div className="min-w-0 flex-1 overflow-y-auto py-2">
        <InstanceGrid
          instances={instances}
          folders={folders}
          rootGroupName={rootGroupName}
          rootGroupIcon={rootGroupIcon}
          selectedId={selectedInstance?.id ?? null}
          runningId={runningId}
          onSelect={selectInstance}
          onLaunch={launch}
          onStop={stop}
          onEdit={handleEdit}
          onDelete={setDeleteTargetId}
          onExport={setExportTargetId}
          onImport={handleImport}
          onCreate={() => navigate('/instances/new')}
          onCreateFolder={() => setFolderDialog({ mode: 'create' })}
          onRenameFolder={(folderId) => {
            const folder = folders.find((f) => f.id === folderId)
            if (folder)
              setFolderDialog({
                mode: 'rename',
                folderId,
                initialName: folder.name,
              })
          }}
          onDeleteFolder={setDeleteFolderTarget}
          onRenameRoot={() =>
            setFolderDialog({
              mode: 'rename',
              isRoot: true,
              initialName: rootGroupName,
            })
          }
          onPickRootIcon={handlePickRootIcon}
          onToggleCollapsed={handleToggleCollapsed}
          onMoveToFolder={handleMoveToFolder}
          onReorderFolders={(orderedIds) =>
            reorderFolders(orderedIds).catch(() =>
              toast.error('Falha ao reordenar pastas'),
            )
          }
          onReorderInstances={(orderedIds) =>
            reorderInstances(orderedIds).catch(() =>
              toast.error('Falha ao reordenar instâncias'),
            )
          }
          onRefresh={() => {
            refresh()
            refreshFolders()
          }}
        />
      </div>

      {selectedInstance && (
        <InstanceSidebar
          instance={selectedInstance}
          isRunning={runningId === selectedInstance.id}
          onLaunch={launch}
          onStop={stop}
          onEdit={handleEdit}
          onDelete={setDeleteTargetId}
          onExport={setExportTargetId}
        />
      )}

      {folderDialog && (
        <FolderNameDialog
          key={
            folderDialog.folderId ?? (folderDialog.isRoot ? 'root' : 'create')
          }
          open
          onOpenChange={(open) => !open && setFolderDialog(null)}
          title={
            folderDialog.mode === 'create'
              ? 'Nova Pasta'
              : folderDialog.isRoot
                ? 'Renomear Grupo'
                : 'Renomear Pasta'
          }
          description={
            folderDialog.isRoot
              ? 'Defina um nome para o grupo de instâncias que ficam fora das pastas.'
              : 'Organize suas instâncias em pastas. Você pode arrastar instâncias para dentro ou para fora.'
          }
          initialName={
            folderDialog.mode === 'rename' ? folderDialog.initialName : ''
          }
          submitLabel={folderDialog.mode === 'rename' ? 'Salvar' : 'Criar'}
          onSubmit={
            folderDialog.mode === 'rename'
              ? handleRenameFolder
              : handleCreateFolder
          }
        />
      )}

      <ConfirmDeleteFolderDialog
        folder={deleteFolderTarget}
        onOpenChange={(open) => !open && setDeleteFolderTarget(null)}
        onConfirm={handleDeleteFolder}
      />

      <DeleteInstanceDialog
        instance={deleteTarget}
        isRunning={runningId === deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />

      {exportTarget && (
        <ExportAstropackDialog
          open={!!exportTargetId}
          onOpenChange={(open) => !open && setExportTargetId(null)}
          instance={exportTarget}
        />
      )}

      <ImportAstropackDialog
        open={!!importFilePath}
        onOpenChange={(open) => {
          if (!open) {
            setImportFilePath(null)
            refresh()
          }
        }}
        filePath={importFilePath ?? ''}
        onImported={() => refresh()}
      />
    </Shell>
  )
}
