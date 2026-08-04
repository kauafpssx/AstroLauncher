import { ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'

export interface SidebarNavItem<T extends string> {
  id: T
  label: string
  icon?: LucideIcon
  iconSrc?: string
  disabled?: boolean
}

interface SidebarNavProps<T extends string> {
  title: string
  items: SidebarNavItem<T>[]
  active: T | null
  onChange: (id: T) => void
  titleIcon?: LucideIcon
  onBack?: () => void
  disabled?: boolean
  footer?: ReactNode
  className?: string
}

export function SidebarNav<T extends string>({
  title,
  items,
  active,
  onChange,
  titleIcon: TitleIcon,
  onBack,
  disabled,
  footer,
  className,
}: SidebarNavProps<T>) {
  return (
    <aside
      className={cn(
        'flex w-56 shrink-0 flex-col gap-4 border-r p-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-1">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            {...tooltipProps('Voltar')}
            className={cn(
              'bg-primary/10 text-primary hover:bg-primary/20 flex size-7 items-center justify-center rounded-md transition-colors',
              disabled && 'hover:bg-primary/10 cursor-not-allowed opacity-50',
            )}
          >
            <ArrowLeft className="size-4" />
          </button>
        ) : (
          TitleIcon && (
            <div className="bg-primary/10 flex size-7 items-center justify-center rounded-md">
              <TitleIcon className="text-primary size-4" />
            </div>
          )
        )}
        <span className="truncate font-semibold">{title}</span>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled || disabled}
              onClick={() => onChange(item.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                (item.disabled || disabled) &&
                  'hover:text-muted-foreground cursor-not-allowed opacity-50 hover:bg-transparent',
              )}
            >
              {item.iconSrc ? (
                <img src={item.iconSrc} alt="" className="size-4" />
              ) : item.icon ? (
                <item.icon className="size-4" />
              ) : null}
              {item.label}
            </button>
          )
        })}
      </nav>

      {footer}
    </aside>
  )
}
