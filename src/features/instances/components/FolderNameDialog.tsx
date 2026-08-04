import { SingleFieldDialog } from '@/components/common/SingleFieldDialog'

interface FolderNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  initialName?: string
  submitLabel?: string
  onSubmit: (name: string) => Promise<void>
}

export function FolderNameDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName = '',
  submitLabel = 'Criar',
  onSubmit,
}: FolderNameDialogProps) {
  return (
    <SingleFieldDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      fieldId="folder-name"
      fieldLabel="Nome da pasta"
      placeholder="Ex.: Modpacks, Survival, Testes"
      initialValue={initialName}
      submitLabel={submitLabel}
      submitLoadingLabel="Salvando..."
      showCancel
      cancelLabel="Cancelar"
      onSubmit={onSubmit}
    />
  )
}
