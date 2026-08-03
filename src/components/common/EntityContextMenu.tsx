import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
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

export interface ContextMenuSubmenu {
  key: string
  icon: LucideIcon
  label: string
  items: ContextMenuAction[]
  separatorBefore?: boolean
}

interface EntityContextMenuProps {
  actions: ContextMenuAction[]
  submenus?: ContextMenuSubmenu[]
  children: ReactNode
  stopPropagation?: boolean
}

function renderAction({
  key,
  icon: Icon,
  label,
  onSelect,
  variant,
  separatorBefore,
}: ContextMenuAction) {
  return (
    <div key={key}>
      {separatorBefore && <ContextMenuSeparator />}
      <ContextMenuItem variant={variant} onSelect={onSelect}>
        <Icon /> {label}
      </ContextMenuItem>
    </div>
  )
}

function renderSubmenu({
  key,
  icon: Icon,
  label,
  items,
  separatorBefore,
}: ContextMenuSubmenu) {
  return (
    <div key={key}>
      {separatorBefore && <ContextMenuSeparator />}
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Icon /> {label}
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="max-h-72 overflow-y-auto">
          {items.map((item, index) => (
            <div key={item.key}>
              {item.separatorBefore && index > 0 && <ContextMenuSeparator />}
              <ContextMenuItem variant={item.variant} onSelect={item.onSelect}>
                <item.icon /> {item.label}
              </ContextMenuItem>
            </div>
          ))}
        </ContextMenuSubContent>
      </ContextMenuSub>
    </div>
  )
}

export function EntityContextMenu({
  actions,
  submenus = [],
  children,
  stopPropagation = false,
}: EntityContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger
        asChild
        onContextMenu={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {submenus.map(renderSubmenu)}
        {actions.map(renderAction)}
      </ContextMenuContent>
    </ContextMenu>
  )
}
