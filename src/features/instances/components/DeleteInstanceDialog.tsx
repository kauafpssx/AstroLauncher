import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { InstanceDTO } from '@/types/instance'

interface DeleteInstanceDialogProps {
  instance: InstanceDTO | null
  isRunning: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DeleteInstanceDialog({ instance, isRunning, onOpenChange, onConfirm }: DeleteInstanceDialogProps) {
  return (
    <AlertDialog open={!!instance} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir instância</AlertDialogTitle>
          <AlertDialogDescription>
            {isRunning ? (
              <>
                <strong className="text-destructive">{instance?.name}</strong> está em execução. Encerre o jogo antes de
                excluir esta instância.
              </>
            ) : (
              <>
                Isso vai apagar <strong>{instance?.name}</strong> e todos os arquivos da instância (saves, config, mods)
                permanentemente. Essa ação não pode ser desfeita.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {!isRunning && (
            <AlertDialogAction variant="destructive" onClick={onConfirm}>
              Excluir
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
