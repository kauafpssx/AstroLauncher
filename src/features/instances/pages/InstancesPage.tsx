import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Shell } from '@/components/layout/Shell'
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'
import { useInstanceStore, useSelectedInstance } from '@/stores/instance.store'

import { DeleteInstanceDialog } from '../components/DeleteInstanceDialog'
import { ExportAstropackDialog } from '../components/ExportAstropackDialog'
import { ImportAstropackDialog } from '../components/ImportAstropackDialog'
import { InstanceGrid } from '../components/InstanceGrid'
import { InstanceSidebar } from '../components/InstanceSidebar'
import { useInstances } from '../hooks/useInstances'
import { useLaunchInstance } from '../hooks/useLaunchInstance'

export function InstancesPage() {
  const navigate = useNavigate()
  const { instances, deleteInstance, refresh } = useInstances()
  const selectedInstance = useSelectedInstance()
  const selectInstance = useInstanceStore((s) => s.selectInstance)
  const { launch, stop, runningId } = useLaunchInstance()
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [exportTargetId, setExportTargetId] = useState<string | null>(null)
  const [importFilePath, setImportFilePath] = useState<string | null>(null)

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

  return (
    <Shell
      topBar={<TopBar onCreateInstance={() => navigate('/instances/new')} onImportInstance={handleImport} />}
      statusBar={<StatusBar instanceCount={instances.length} />}
    >
      <div className="min-w-0 flex-1 overflow-y-auto py-2">
        <InstanceGrid
          instances={instances}
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
