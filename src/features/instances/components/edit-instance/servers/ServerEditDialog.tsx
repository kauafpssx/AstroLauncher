import { type Dispatch, type SetStateAction } from 'react'
import { toast } from 'sonner'

import { CharacterCounter } from '@/components/common/CharacterCounter'
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
import {
  MAX,
  getFirstIssue,
  serverIpSchema,
  serverNameSchema,
} from '@/lib/validation'

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
  const handleSave = () => {
    if (!editing) return
    const nameIssue = getFirstIssue(serverNameSchema, editing.name)
    if (nameIssue) {
      toast.error(nameIssue)
      return
    }
    const ipIssue = getFirstIssue(serverIpSchema, editing.ip)
    if (ipIssue) {
      toast.error(ipIssue)
      return
    }
    onSave()
  }

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
              maxLength={MAX.SERVER_NAME}
              value={editing?.name ?? ''}
              onChange={(e) =>
                onEditingChange((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev,
                )
              }
              autoFocus
            />
            <CharacterCounter
              value={editing?.name ?? ''}
              max={MAX.SERVER_NAME}
              className="self-end"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="server-ip">Endereço (IP:porta)</Label>
            <Input
              id="server-ip"
              placeholder="play.exemplo.com"
              maxLength={MAX.SERVER_IP}
              value={editing?.ip ?? ''}
              onChange={(e) =>
                onEditingChange((prev) =>
                  prev ? { ...prev, ip: e.target.value } : prev,
                )
              }
            />
            <CharacterCounter
              value={editing?.ip ?? ''}
              max={MAX.SERVER_IP}
              className="self-end"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onEditingChange(null)}>
            Cancelar
          </Button>
          <Button
            disabled={!editing?.name.trim() || !editing?.ip.trim() || isSaving}
            onClick={handleSave}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
