import { Package } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'

import { resolveIconSrc } from '@/lib/icon-src'
import { cn } from '@/lib/utils'

import { IconPickerDialog } from './IconPickerDialog'

interface IconPickerButtonProps {
  iconPath: string | null
  onSelect: (iconPath: string) => void
  className?: string
  iconClassName?: string
  fallbackIconClassName?: string
  rounded?: 'rounded-md' | 'rounded-lg' | 'rounded-xl'
  overlay?: ReactNode
  /** When false, a plain click no longer opens the picker — used where the icon sits inside a card that already has its own click/double-click behavior. */
  clickOpensPicker?: boolean
  onDoubleClick?: () => void
}

export function IconPickerButton({
  iconPath,
  onSelect,
  className,
  iconClassName,
  fallbackIconClassName,
  rounded = 'rounded-md',
  overlay,
  clickOpensPicker = true,
  onDoubleClick,
}: IconPickerButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => clickOpensPicker && setOpen(true)}
        onDoubleClick={(e) => {
          if (!onDoubleClick) return
          e.stopPropagation()
          onDoubleClick()
        }}
        className={cn('relative flex items-center justify-center bg-muted transition-opacity hover:opacity-80', rounded, className)}
      >
        {iconPath ? (
          <img
            src={resolveIconSrc(iconPath)}
            alt=""
            className={cn('size-full object-cover [image-rendering:pixelated]', rounded, iconClassName)}
          />
        ) : (
          <Package className={cn('text-muted-foreground', fallbackIconClassName)} />
        )}
        {overlay}
      </button>
      <IconPickerDialog open={open} onOpenChange={setOpen} onSelect={onSelect} />
    </>
  )
}
