import { ChevronDown, UserCircle2, UserCog } from 'lucide-react'
import { useState } from 'react'

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
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useAccountStore, useDefaultAccount } from '@/stores/account.store'

export function AccountDropdown() {
  const { accounts } = useAccounts()
  const defaultAccount = useDefaultAccount()
  const setDefaultAccount = useAccountStore((s) => s.setDefaultAccount)
  const [addOpen, setAddOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

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
          <EntityAvatar
            name={active.username}
            className="size-5"
            fallbackClassName="text-[10px]"
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
            <EntityAvatar
              name={account.username}
              className="size-5"
              fallbackClassName="text-[10px]"
            />
            {account.username}
            {account.isDefault && (
              <span className="text-muted-foreground ml-auto text-xs">
                ativa
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setManageOpen(true)}>
          <UserCog /> Gerenciar contas
        </DropdownMenuItem>
      </DropdownMenuContent>
      <AccountsDialog open={manageOpen} onOpenChange={setManageOpen} />
    </DropdownMenu>
  )
}
