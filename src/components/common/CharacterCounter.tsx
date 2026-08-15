import { cn } from '@/lib/utils'

interface CharacterCounterProps {
  value: string
  max: number
  className?: string
}

/**
 * Discreet `{length}/{max}` counter shown only while the field is close to
 * its limit (10 characters left or less), turning destructive at the limit.
 * Returns null otherwise so it never affects the layout.
 */
export function CharacterCounter({
  value,
  max,
  className,
}: CharacterCounterProps) {
  const remaining = max - value.length
  if (remaining > 10) return null
  return (
    <span
      className={cn(
        'text-muted-foreground text-[10px] leading-none tabular-nums',
        remaining === 0 && 'text-destructive font-medium',
        className,
      )}
    >
      {value.length}/{max}
    </span>
  )
}
