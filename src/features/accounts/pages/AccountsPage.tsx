import { ArrowLeft, GripVertical, MoreHorizontal, Pencil, Plus, Trash2, UserCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useAccountStore } from '@/stores/account.store'
import type { AccountDTO } from '@/types/account'

import { AccountSheet } from '../components/AccountSheet'
import { useAccounts } from '../hooks/useAccounts'

export function AccountsPage() {
  const navigate = useNavigate()
  const { accounts } = useAccounts()
  const createAccount = useAccountStore((s) => s.createAccount)
  const updateAccount = useAccountStore((s) => s.updateAccount)
  const deleteAccount = useAccountStore((s) => s.deleteAccount)
  const setDefaultAccount = useAccountStore((s) => s.setDefaultAccount)
  const reorderAccounts = useAccountStore((s) => s.reorderAccounts)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountDTO | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const openCreate = () => {
    setEditingAccount(null)
    setSheetOpen(true)
  }

  const openEdit = (account: AccountDTO) => {
    setEditingAccount(account)
    setSheetOpen(true)
  }

  const handleSubmit = async (username: string) => {
    if (editingAccount) {
      await updateAccount({ id: editingAccount.id, username })
      toast.success('Conta atualizada')
    } else {
      await createAccount({ username })
      toast.success('Conta adicionada')
    }
  }

  const handleDelete = async (id: string) => {
    await deleteAccount(id)
    toast.success('Conta removida')
  }

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return
    const ids = accounts.map((a) => a.id)
    const fromIndex = ids.indexOf(draggingId)
    const toIndex = ids.indexOf(targetId)
    ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, draggingId)
    reorderAccounts(ids)
    setDraggingId(null)
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft />
        </Button>
        <span className="font-medium">Contas</span>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between border-b pb-4">
            <CardTitle>Contas</CardTitle>
            <Button size="sm" onClick={openCreate}>
              <Plus /> Adicionar Conta
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            {accounts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <UserCircle2 className="size-10 text-muted-foreground" />
                <p className="font-medium">Nenhuma conta cadastrada</p>
                <p className="text-sm text-muted-foreground">Adicione uma conta offline para começar a jogar.</p>
                <Button className="mt-2" onClick={openCreate}>
                  <Plus /> Adicionar Conta
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Username</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow
                      key={account.id}
                      draggable
                      onDragStart={() => setDraggingId(account.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(account.id)}
                      className={cn(
                        'cursor-default',
                        account.isDefault && 'bg-primary/5',
                        draggingId === account.id && 'opacity-50',
                      )}
                    >
                      <TableCell>
                        <GripVertical className="size-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setDefaultAccount(account.id)}
                          className="flex items-center gap-2.5 text-left"
                          title="Definir como padrão"
                        >
                          <span
                            className={cn(
                              'flex size-4 shrink-0 items-center justify-center rounded-full border-2',
                              account.isDefault ? 'border-primary' : 'border-muted-foreground',
                            )}
                          >
                            {account.isDefault && <span className="size-2 rounded-full bg-primary" />}
                          </span>
                          <Avatar className="size-6">
                            <AvatarFallback className="text-[10px]">
                              {account.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{account.username}</span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {account.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Pronta</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openEdit(account)}>
                              <Pencil /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(account.id)}>
                              <Trash2 /> Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AccountSheet open={sheetOpen} onOpenChange={setSheetOpen} account={editingAccount} onSubmit={handleSubmit} />
    </div>
  )
}
