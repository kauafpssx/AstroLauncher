import type { ReactNode } from 'react'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressGroupProps {
  label: ReactNode
  value?: number
  rightLabel?: ReactNode
  className?: string
  barClassName?: string
  children?: ReactNode
}

export function ProgressGroup({
  label,
  value,
  rightLabel,
  className,
  barClassName,
  children,
}: ProgressGroupProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{label}</span>
        {rightLabel && <span>{rightLabel}</span>}
      </div>
      <Progress value={value} className={barClassName} />
      {children}
    </div>
  )
}
