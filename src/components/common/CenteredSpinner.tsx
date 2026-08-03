import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface CenteredSpinnerProps {
  className?: string
  iconClassName?: string
}

export function CenteredSpinner({
  className,
  iconClassName,
}: CenteredSpinnerProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 items-center justify-center',
        className,
      )}
    >
      <Loader2
        className={cn(
          'text-muted-foreground size-6 animate-spin',
          iconClassName,
        )}
      />
    </div>
  )
}
