import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { seedSchema } from '@/lib/validation'
export function CustomSeedDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (seed: string) => void
}) {
  const [input, setInput] = useState('')
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setInput('')
    onOpenChange(nextOpen)
  }
  const result = seedSchema.safeParse(input)
  const error =
    input !== '' && !result.success ? result.error.issues[0]?.message : null
  const handleConfirm = () => {
    if (!result.success) return
    onConfirm(result.data)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Seed customizada</DialogTitle>
          <DialogDescription>
            Só números, até 20 dígitos. Use "-" no início pra negativo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label className="text-xs">Seed</Label>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: 12345 ou -987654321"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            type="button"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!result.success}
            type="button"
          >
            Usar seed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
