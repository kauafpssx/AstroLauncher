import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

export interface ContextMenuAction {
  key: string
  icon: LucideIcon
  label: string
  onSelect: () => void
  variant?: 'default' | 'destructive'
  separatorBefore?: boolean
}

interface EntityContextMenuProps {
  actions: ContextMenuAction[]
  children: ReactNode
}

export function EntityContextMenu({ actions, children }: EntityContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {actions.map(({ key, icon: Icon, label, onSelect, variant, separatorBefore }) => (
          <div key={key}>
            {separatorBefore && <ContextMenuSeparator />}
            <ContextMenuItem variant={variant} onSelect={onSelect}>
              <Icon /> {label}
            </ContextMenuItem>
          </div>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}
