import { RotateCcw, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface SaveButtonProps {
  onClick: () => void
  disabled?: boolean
  isSaving?: boolean
}

export function SaveButton({ onClick, disabled, isSaving }: SaveButtonProps) {
  return (
    <Button size="sm" onClick={onClick} disabled={disabled || isSaving}>
      <Save /> {isSaving ? 'Salvando...' : 'Salvar'}
    </Button>
  )
}

interface DiscardButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function DiscardButton({ onClick, disabled }: DiscardButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      <RotateCcw /> Descartar
    </Button>
  )
}
