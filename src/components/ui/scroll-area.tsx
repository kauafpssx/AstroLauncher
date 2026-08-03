'use client'

import * as React from 'react'
import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        // Radix wraps children in an internal `display:table` sizer div for
        // scroll measurement — that shrink-to-fit layout ignores the
        // viewport's actual width, silently breaking any `truncate`/`min-w-0`
        // downstream (content just grows as wide as it wants). Force it back
        // to a normal block so width constraints from our own layout apply.
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&>div]:!block"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        'flex touch-none transition-colors select-none data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:h-full data-[orientation=vertical]:w-3',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        // Radix only mounts the thumb once its own resize-observer math says
        // the content actually overflows (`hasThumb`) — inside a
        // react-resizable-panels column that measurement can land at 0 on
        // first paint and never re-fire. forceMount guarantees the thumb is
        // always in the DOM; Radix still sizes/positions it correctly.
        forceMount
        className="bg-muted-foreground/60 hover:bg-muted-foreground/80 relative mx-auto my-auto h-full w-2 rounded-full data-[orientation=horizontal]:mx-auto data-[orientation=horizontal]:my-auto data-[orientation=horizontal]:h-2 data-[orientation=vertical]:w-2"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
