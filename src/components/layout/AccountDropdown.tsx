import { Check, ChevronDown, UserCircle2, UserCog } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { EntityAvatar } from '@/components/common/EntityAvatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountsDialog } from '@/features/accounts/components/AccountsDialog'
import { AddAccountDialog } from '@/features/accounts/components/AddAccountDialog'
import { SkinHeadPickerDialog } from '@/features/accounts/components/SkinHeadPickerDialog'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { CustomIconAPI } from '@/features/instances/services/custom-icon.api'
import { resolveIconSrc } from '@/lib/icon-src'
import { tooltipProps } from '@/lib/tooltip'
import { useAccountStore, useDefaultAccount } from '@/stores/account.store'
import type { AccountDTO } from '@/types/account'

/** Wraps an account avatar so clicking it opens the skin-head picker instead
 * of bubbling to whatever selectable container it sits in (the dropdown
 * trigger button, a menu item). A `<span role="button">` rather than a real
 * `<button>`: the trigger case nests this inside an actual `<button>`, and
 * browsers don't allow nested `<button>` elements. */
function AvatarPickerHandle({
  account,
  onOpenPicker,
  className,
}: {
  account: AccountDTO
  onOpenPicker: (accountId: string) => void
  className?: string
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        onOpenPicker(account.id)
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.stopPropagation()
        e.preventDefault()
        onOpenPicker(account.id)
      }}
      className={className}
      {...tooltipProps('Escolher avatar a partir de uma skin')}
    >
      <EntityAvatar
        name={account.username}
        iconUrl={resolveIconSrc(account.iconPath)}
        className="size-5"
        fallbackClassName="text-[10px]"
      />
    </span>
  )
}

export function AccountDropdown() {
  const { accounts } = useAccounts()
  const defaultAccount = useDefaultAccount()
  const setDefaultAccount = useAccountStore((s) => s.setDefaultAccount)
  const updateAccount = useAccountStore((s) => s.updateAccount)
  const [addOpen, setAddOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [skinPickerAccountId, setSkinPickerAccountId] = useState<string | null>(
    null,
  )

  const handlePickHead = async (base64Png: string) => {
    const account = accounts.find((a) => a.id === skinPickerAccountId)
    if (!account) return
    try {
      const saved = await CustomIconAPI.save(base64Png)
      await updateAccount({
        id: account.id,
        username: account.username,
        iconPath: saved.path,
      })
    } catch (err) {
      toast.error(`Falha ao salvar avatar: ${String(err)}`)
    }
  }

  if (accounts.length === 0) {
    return (
      <>
        <Button variant="ghost" onClick={() => setAddOpen(true)}>
          <UserCircle2 /> Nenhuma conta
        </Button>
        <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
      </>
    )
  }

  const active = defaultAccount ?? accounts[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <AvatarPickerHandle
            account={active}
            onOpenPicker={setSkinPickerAccountId}
            className="rounded-md"
          />
          {active.username}
          <ChevronDown className="text-muted-foreground size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onSelect={() => setDefaultAccount(account.id)}
          >
            <AvatarPickerHandle
              account={account}
              onOpenPicker={setSkinPickerAccountId}
              className="rounded-md"
            />
            {account.username}
            {account.isDefault && (
              <Check
                className="text-muted-foreground ml-auto size-3.5"
                {...tooltipProps('Conta ativa')}
              />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setManageOpen(true)}>
          <UserCog /> Gerenciar contas
        </DropdownMenuItem>
      </DropdownMenuContent>
      <AccountsDialog open={manageOpen} onOpenChange={setManageOpen} />
      <SkinHeadPickerDialog
        open={skinPickerAccountId !== null}
        onOpenChange={(open) => !open && setSkinPickerAccountId(null)}
        onPick={handlePickHead}
      />
    </DropdownMenu>
  )
}
