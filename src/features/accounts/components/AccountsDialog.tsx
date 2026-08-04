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
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { TabHeader } from '@/components/common/TabHeader'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
            <DialogDescription>Gerencie suas contas offline.</DialogDescription>
          </DialogHeader>

          <TabHeader
            description={`${accounts.length} ${
              accounts.length === 1 ? 'conta cadastrada' : 'contas cadastradas'
            }`}
          >
            <Button size="sm" onClick={openCreate}>
              <Plus /> Adicionar Conta
            </Button>
          </TabHeader>

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
                      />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
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
