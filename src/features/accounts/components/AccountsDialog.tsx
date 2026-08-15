import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, UserCircle2 } from 'lucide-react'
import { useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAccountStore } from '@/stores/account.store'
import type { AccountDTO } from '@/types/account'

import { useAccounts } from '../hooks/useAccounts'
import { AccountRow } from './AccountRow'
import { AccountSheet } from './AccountSheet'

interface AccountsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountsDialog({ open, onOpenChange }: AccountsDialogProps) {
  const { accounts } = useAccounts()
  const createAccount = useAccountStore((s) => s.createAccount)
  const updateAccount = useAccountStore((s) => s.updateAccount)
  const deleteAccount = useAccountStore((s) => s.deleteAccount)
  const setDefaultAccount = useAccountStore((s) => s.setDefaultAccount)
  const reorderAccounts = useAccountStore((s) => s.reorderAccounts)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountDTO | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )

  const openCreate = () => {
    setEditingAccount(null)
    setSheetOpen(true)
  }

  const openEdit = (account: AccountDTO) => {
    setEditingAccount(account)
    setSheetOpen(true)
  }

  const handleSubmit = async (username: string, iconPath: string | null) => {
    if (editingAccount) {
      await updateAccount({ id: editingAccount.id, username, iconPath })
    } else {
      await createAccount({ username, iconPath })
    }
  }

  const handleDelete = async (id: string) => {
    await deleteAccount(id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = accounts.map((a) => a.id)
    const fromIndex = ids.indexOf(active.id as string)
    const toIndex = ids.indexOf(over.id as string)
    reorderAccounts(arrayMove(ids, fromIndex, toIndex))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contas</DialogTitle>
            <div className="flex items-center justify-between gap-2">
              <DialogDescription>
                Gerencie suas contas offline.
              </DialogDescription>
              <Button size="sm" onClick={openCreate}>
                <Plus /> Adicionar Conta
              </Button>
            </div>
          </DialogHeader>

          {accounts.length === 0 ? (
            <EmptyState
              icon={UserCircle2}
              title="Nenhuma conta cadastrada"
              description="Adicione uma conta offline para começar a jogar."
              action={
                <Button className="mt-2" onClick={openCreate}>
                  <Plus /> Adicionar Conta
                </Button>
              }
              className="py-16"
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <ScrollArea type="always" className="max-h-72">
                <Table>
                  <TableHeader className="bg-popover sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right whitespace-nowrap">
                        {accounts.length}{' '}
                        {accounts.length === 1 ? 'conta' : 'contas'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <SortableContext
                    items={accounts.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <TableBody>
                      {accounts.map((account) => (
                        <AccountRow
                          key={account.id}
                          account={account}
                          onSetDefault={() => setDefaultAccount(account.id)}
                          onEdit={() => openEdit(account)}
                          onDelete={() => handleDelete(account.id)}
                          onUpdateIcon={(iconPath) =>
                            updateAccount({
                              id: account.id,
                              username: account.username,
                              iconPath,
                            })
                          }
                        />
                      ))}
                    </TableBody>
                  </SortableContext>
                </Table>
              </ScrollArea>
            </DndContext>
          )}
        </DialogContent>
      </Dialog>

      <AccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        account={editingAccount}
        onSubmit={handleSubmit}
      />
    </>
  )
}
