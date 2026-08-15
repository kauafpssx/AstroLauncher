import { toast } from 'sonner'

import { SingleFieldDialog } from '@/components/common/SingleFieldDialog'
import { MAX, accountUsernameSchema } from '@/lib/validation'
import { useAccountStore } from '@/stores/account.store'

interface AddAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddAccountDialog({
  open,
  onOpenChange,
}: AddAccountDialogProps) {
  const createAccount = useAccountStore((s) => s.createAccount)

  return (
    <SingleFieldDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar Conta"
      description="Você ainda não tem nenhuma conta. Contas offline usam apenas um nome de usuário customizado."
      fieldId="first-account-username"
      fieldLabel="Username"
      placeholder="Steve"
      maxLength={MAX.ACCOUNT_USERNAME}
      schema={accountUsernameSchema}
      submitLabel="Adicionar"
      submitLoadingLabel="Adicionando..."
      onSubmit={async (username) => {
        try {
          await createAccount({ username })
        } catch (err) {
          toast.error(`Falha ao adicionar conta: ${String(err)}`)
          throw err
        }
      }}
    />
  )
}
