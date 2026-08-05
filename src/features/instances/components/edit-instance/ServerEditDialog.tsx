import { type Dispatch, type SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { EditingState } from './server-editing'

interface ServerEditDialogProps {
  editing: EditingState | null
  isSaving: boolean
  onEditingChange: Dispatch<SetStateAction<EditingState | null>>
  onSave: () => void
}

export function ServerEditDialog({
  editing,
  isSaving,
  onEditingChange,
  onSave,
}: ServerEditDialogProps) {
  return (
    <Dialog
      open={!!editing}
      onOpenChange={(open) => !open && onEditingChange(null)}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editing?.index === null ? 'Adicionar Servidor' : 'Editar Servidor'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="server-name">Nome</Label>
            <Input
              id="server-name"
              value={editing?.name ?? ''}
              onChange={(e) =>
                onEditingChange((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev,
                )
              }
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="server-ip">Endereço (IP:porta)</Label>
            <Input
              id="server-ip"
              placeholder="play.exemplo.com"
              value={editing?.ip ?? ''}
              onChange={(e) =>
                onEditingChange((prev) =>
                  prev ? { ...prev, ip: e.target.value } : prev,
                )
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onEditingChange(null)}>
            Cancelar
          </Button>
          <Button
            disabled={!editing?.name.trim() || !editing?.ip.trim() || isSaving}
            onClick={onSave}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
