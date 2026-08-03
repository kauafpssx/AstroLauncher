import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import type { InstanceDTO } from '@/types/instance'

interface DeleteInstanceDialogProps {
  instance: InstanceDTO | null
  isRunning: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteInstanceDialog({ instance, isRunning, onOpenChange, onConfirm }: DeleteInstanceDialogProps) {
  if (!isRunning) {
    return (
      <ConfirmDeleteDialog
        open={!!instance}
        onOpenChange={onOpenChange}
        title="Excluir instância"
        description={
          <>
            Isso vai apagar <strong>{instance?.name}</strong> e todos os arquivos da instância (saves, config, mods)
            permanentemente. Essa ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={onConfirm}
      />
    )
  }

  return (
    <AlertDialog open={!!instance} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir instância</AlertDialogTitle>
          <AlertDialogDescription>
            <strong className="text-destructive">{instance?.name}</strong> está em execução. Encerre o jogo antes de
            excluir esta instância.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
