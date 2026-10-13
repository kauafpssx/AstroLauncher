import { Shell } from '@/components/layout/Shell'
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { InstanceGrid } from '@/features/instances/components/instance-grid/InstanceGrid'
import { InstanceSidebar } from '@/features/instances/components/instances-page/InstanceSidebar'
import { InstancesBackground } from '@/features/instances/components/instances-page/InstancesBackground'
import { InstancesPageDialogs } from '@/features/instances/components/instances-page/InstancesPageDialogs'
import { useInstancesPage } from '@/features/instances/hooks/useInstancesPage'
export function InstancesPage() {
  const page = useInstancesPage()
  const {
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
    setDeleteTargetId,
    setExportTargetId,
    setFolderDialog,
    setDeleteFolderTarget,
    refreshAll,
    handleEdit,
    handleDuplicate,
    handleImport,
    handlePickRootIcon,
    handleToggleCollapsed,
    handleMoveToFolder,
    handleReorderFolders,
    handleReorderInstances,
  } = page
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
      <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
        <ResizablePanel minSize="320px">
          <div className="relative h-full min-w-0 overflow-y-auto py-2">
            <InstancesBackground />
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
              onDuplicate={handleDuplicate}
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
              onReorderFolders={handleReorderFolders}
              onReorderInstances={handleReorderInstances}
              onRefresh={refreshAll}
            />
          </div>
        </ResizablePanel>

        {selectedInstance && (
          <>
            <ResizableHandle />

            <ResizablePanel defaultSize="256px" minSize="220px" maxSize="420px">
              <InstanceSidebar
                instance={selectedInstance}
                isRunning={runningId === selectedInstance.id}
                onLaunch={launch}
                onStop={stop}
                onEdit={handleEdit}
                onDelete={setDeleteTargetId}
                onExport={setExportTargetId}
                onDuplicate={handleDuplicate}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      <InstancesPageDialogs page={page} />
    </Shell>
  )
}
