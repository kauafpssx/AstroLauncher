import type { ReactNode } from 'react'

interface TabHeaderProps {
  description: string
  children?: ReactNode
}

export function TabHeader({ description, children }: TabHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{description}</p>
      {children && <div className="flex items-center gap-1">{children}</div>}
    </div>
  )
}
