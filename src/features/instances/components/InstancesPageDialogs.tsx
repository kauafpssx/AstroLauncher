import type { useInstancesPage } from '../hooks/useInstancesPage'
import { ConfirmDeleteFolderDialog } from './ConfirmDeleteFolderDialog'
import { DeleteInstanceDialog } from './DeleteInstanceDialog'
import { ExportAstropackDialog } from './ExportAstropackDialog'
import { FolderNameDialog } from './FolderNameDialog'
import { ImportAstropackDialog } from './ImportAstropackDialog'

interface InstancesPageDialogsProps {
  page: ReturnType<typeof useInstancesPage>
}

export function InstancesPageDialogs({ page }: InstancesPageDialogsProps) {
  const {
    folderDialog,
    setFolderDialog,
    handleRenameFolder,
    handleCreateFolder,
    deleteFolderTarget,
    setDeleteFolderTarget,
    handleDeleteFolder,
    deleteTarget,
    deleteTargetId,
    setDeleteTargetId,
    runningId,
    confirmDelete,
    exportTarget,
    exportTargetId,
    setExportTargetId,
    importFilePath,
    setImportFilePath,
    refresh,
  } = page

  return (
    <>
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
    </>
  )
}
