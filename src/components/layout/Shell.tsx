import type { ReactNode } from 'react'

interface ShellProps {
  topBar: ReactNode
  statusBar: ReactNode
  children: ReactNode
}

export function Shell({ topBar, statusBar, children }: ShellProps) {
  return (
    <div className="flex h-screen flex-col">
      {topBar}
      <div className="flex min-h-0 flex-1">{children}</div>
      {statusBar}
    </div>
  )
}
