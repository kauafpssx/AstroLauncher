import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import type { FolderDTO } from '@/types/folder'

interface ConfirmDeleteFolderDialogProps {
  folder: FolderDTO | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmDeleteFolderDialog({
  folder,
  onOpenChange,
  onConfirm,
}: ConfirmDeleteFolderDialogProps) {
  return (
    <ConfirmDeleteDialog
      open={!!folder}
      onOpenChange={onOpenChange}
      title="Excluir pasta"
      description={
        <>
          Isso vai excluir a pasta <strong>{folder?.name}</strong>. As
          instâncias dentro dela não são apagadas — elas voltam para "Todas as
          Instâncias".
        </>
      }
      confirmLabel="Excluir"
      cancelLabel="Cancelar"
      onConfirm={onConfirm}
    />
  )
}
