import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface CenteredSpinnerProps {
  className?: string
  iconClassName?: string
}

export function CenteredSpinner({ className, iconClassName }: CenteredSpinnerProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 items-center justify-center', className)}>
      <Loader2 className={cn('size-6 animate-spin text-muted-foreground', iconClassName)} />
    </div>
  )
}
