import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useId } from 'react'

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
import { useContextMenuStore } from '@/stores/context-menu.store'

export interface ContextMenuAction {
  key: string
  icon: LucideIcon
  label: string
  onSelect: () => void
  variant?: 'default' | 'destructive'
  separatorBefore?: boolean
}

interface ContextMenuSubmenu {
  key: string
  icon: LucideIcon
  label: string
  items: ContextMenuAction[]
  separatorBefore?: boolean
}

export type ContextMenuItem = ContextMenuAction | ContextMenuSubmenu

interface EntityContextMenuProps {
  items: ContextMenuItem[]
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

function renderItem(item: ContextMenuItem) {
  return 'items' in item ? renderSubmenu(item) : renderAction(item)
}

export function EntityContextMenu({
  items,
  children,
  stopPropagation = false,
}: EntityContextMenuProps) {
  const id = useId()
  const isOpen = useContextMenuStore((s) => s.openId === id)
  const setOpenId = useContextMenuStore((s) => s.setOpenId)

  return (
    <ContextMenu
      open={isOpen}
      onOpenChange={(next) => setOpenId(next ? id : null)}
    >
      <ContextMenuTrigger
        asChild
        onContextMenu={stopPropagation ? (e) => e.stopPropagation() : undefined}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>{items.map(renderItem)}</ContextMenuContent>
    </ContextMenu>
  )
}
