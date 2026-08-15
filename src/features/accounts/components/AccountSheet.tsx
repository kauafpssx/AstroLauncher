import { useState } from 'react'
import { toast } from 'sonner'

import { EntityAvatar } from '@/components/common/EntityAvatar'
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
import { CustomIconAPI } from '@/features/instances/services/custom-icon.api'
import { resolveIconSrc } from '@/lib/icon-src'
import { tooltipProps } from '@/lib/tooltip'
import { MAX, accountUsernameSchema, getFirstIssue } from '@/lib/validation'
import type { AccountDTO } from '@/types/account'

import { SkinHeadPickerDialog } from './SkinHeadPickerDialog'

interface AccountSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountDTO | null
  onSubmit: (username: string, iconPath: string | null) => Promise<void>
}

export function AccountSheet({
  open,
  onOpenChange,
  account,
  onSubmit,
}: AccountSheetProps) {
  const [username, setUsername] = useState('')
  const [iconPath, setIconPath] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skinPickerOpen, setSkinPickerOpen] = useState(false)

  // Prefill the input during render when the sheet opens (or the target
  // account changes) instead of doing it in an effect.
  const sheetKey = `${open}:${account?.id ?? 'new'}`
  const [prevSheetKey, setPrevSheetKey] = useState(sheetKey)
  if (prevSheetKey !== sheetKey) {
    setPrevSheetKey(sheetKey)
    if (open) {
      setUsername(account?.username ?? '')
      setIconPath(account?.iconPath ?? null)
    }
  }

  const handleSubmit = async () => {
    const trimmed = username.trim()
    const issue = getFirstIssue(accountUsernameSchema, trimmed)
    if (issue) {
      toast.error(issue)
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(trimmed, iconPath)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePickHead = async (base64Png: string) => {
    try {
      const saved = await CustomIconAPI.save(base64Png)
      setIconPath(saved.path)
    } catch (err) {
      toast.error(`Falha ao salvar avatar: ${String(err)}`)
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

        <div className="flex flex-col items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => setSkinPickerOpen(true)}
            className="rounded-md"
            {...tooltipProps('Escolher avatar a partir de uma skin')}
          >
            <EntityAvatar
              name={username || 'Steve'}
              iconUrl={resolveIconSrc(iconPath)}
              className="size-16"
              fallbackClassName="text-lg"
            />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-4">
          <Label htmlFor="account-username">Usuário</Label>
          <Input
            id="account-username"
            placeholder="Steve"
            maxLength={MAX.ACCOUNT_USERNAME}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
          />
        </div>

        <SkinHeadPickerDialog
          open={skinPickerOpen}
          onOpenChange={setSkinPickerOpen}
          onPick={handlePickHead}
        />

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
