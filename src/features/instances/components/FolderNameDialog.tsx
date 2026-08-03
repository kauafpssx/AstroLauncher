import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FolderNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  initialName?: string
  submitLabel?: string
  onSubmit: (name: string) => Promise<void>
}

export function FolderNameDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName = '',
  submitLabel = 'Criar',
  onSubmit,
}: FolderNameDialogProps) {
  const [name, setName] = useState(initialName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit(name.trim())
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="folder-name">Nome da pasta</Label>
          <Input
            id="folder-name"
            placeholder="Ex.: Modpacks, Survival, Testes"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
