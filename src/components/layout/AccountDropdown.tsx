import { ChevronDown, UserCircle2, UserCog } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AddAccountDialog } from '@/features/accounts/components/AddAccountDialog'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useAccountStore, useDefaultAccount } from '@/stores/account.store'

export function AccountDropdown() {
  const navigate = useNavigate()
  const { accounts } = useAccounts()
  const defaultAccount = useDefaultAccount()
  const setDefaultAccount = useAccountStore((s) => s.setDefaultAccount)
  const [addOpen, setAddOpen] = useState(false)

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
          <Avatar className="size-5">
            <AvatarFallback className="text-[10px]">{active.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {active.username}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {accounts.map((account) => (
          <DropdownMenuItem key={account.id} onSelect={() => setDefaultAccount(account.id)}>
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px]">{account.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            {account.username}
            {account.isDefault && <span className="ml-auto text-xs text-muted-foreground">ativa</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/accounts')}>
          <UserCog /> Gerenciar contas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
