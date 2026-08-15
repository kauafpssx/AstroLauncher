import { useState } from 'react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import type { z } from 'zod'

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
import { getFirstIssue } from '@/lib/validation'

import { CharacterCounter } from './CharacterCounter'

interface SingleFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  fieldId: string
  fieldLabel: string
  placeholder?: string
  inputType?: 'text' | 'password'
  maxLength?: number
  schema?: z.ZodType<string, string>
  initialValue?: string
  submitLabel: string
  submitLoadingLabel?: string
  showCancel?: boolean
  cancelLabel?: string
  className?: string
  onSubmit: (value: string) => Promise<void>
}

export function SingleFieldDialog({
  open,
  onOpenChange,
  title,
  description,
  fieldId,
  fieldLabel,
  placeholder,
  inputType = 'text',
  maxLength,
  schema,
  initialValue = '',
  submitLabel,
  submitLoadingLabel,
  showCancel,
  cancelLabel = 'Cancelar',
  className = 'sm:max-w-sm',
  onSubmit,
}: SingleFieldDialogProps) {
  const [value, setValue] = useState(initialValue)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset the field to the initial value every time the dialog opens, during
  // render, so there's no stale input from a previous open.
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) setValue(initialValue)
  }

  const handleSubmit = async () => {
    const trimmed = value.trim()
    if (!trimmed || isSubmitting) return
    const issue = schema ? getFirstIssue(schema, trimmed) : null
    if (issue) {
      toast.error(issue)
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit(trimmed)
      onOpenChange(false)
    } catch {
      // Swallowed deliberately: `onSubmit` implementations are expected to
      // surface their own error (toast, inline message) and rejecting here
      // just keeps the dialog open — an unhandled promise rejection would
      // otherwise bubble up from this async event handler with nothing to
      // catch it.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId}>{fieldLabel}</Label>
          <Input
            id={fieldId}
            type={inputType}
            placeholder={placeholder}
            maxLength={maxLength}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
          />
          {maxLength !== undefined && (
            <div className="flex justify-end">
              <CharacterCounter value={value} max={maxLength} />
            </div>
          )}
        </div>
        <DialogFooter>
          {showCancel && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || isSubmitting}
          >
            {isSubmitting ? (submitLoadingLabel ?? submitLabel) : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
