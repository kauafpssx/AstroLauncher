import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { AccountDTO } from '@/types/account'

interface AccountSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountDTO | null
  onSubmit: (username: string) => Promise<void>
}

export function AccountSheet({
  open,
  onOpenChange,
  account,
  onSubmit,
}: AccountSheetProps) {
  const [username, setUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Prefill the input during render when the sheet opens (or the target
  // account changes) instead of doing it in an effect.
  const sheetKey = `${open}:${account?.id ?? 'new'}`
  const [prevSheetKey, setPrevSheetKey] = useState(sheetKey)
  if (prevSheetKey !== sheetKey) {
    setPrevSheetKey(sheetKey)
    if (open) setUsername(account?.username ?? '')
  }

  const handleSubmit = async () => {
    if (!username.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit(username.trim())
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {account ? 'Editar Conta' : 'Adicionar Conta'}
          </SheetTitle>
          <SheetDescription>
            Contas offline usam apenas um nome de usuário customizado, sem
            necessidade de login.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-2 px-4">
          <Label htmlFor="account-username">Username</Label>
          <Input
            id="account-username"
            placeholder="Steve"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
          />
        </div>

        <SheetFooter>
          <Button
            onClick={handleSubmit}
            disabled={!username.trim() || isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
