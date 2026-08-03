import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [username, setUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!username.trim()) return
    setIsSubmitting(true)
    try {
      await createAccount({ username: username.trim() })
      toast.success('Conta adicionada')
      setUsername('')
      onOpenChange(false)
    } catch (err) {
      toast.error(`Falha ao adicionar conta: ${String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Conta</DialogTitle>
          <DialogDescription>
            Você ainda não tem nenhuma conta. Contas offline usam apenas um nome
            de usuário customizado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="first-account-username">Username</Label>
          <Input
            id="first-account-username"
            placeholder="Steve"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!username.trim() || isSubmitting}
          >
            {isSubmitting ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
