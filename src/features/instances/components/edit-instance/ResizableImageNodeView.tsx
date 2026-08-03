import type { NodeViewProps } from '@tiptap/react'
import { NodeViewWrapper } from '@tiptap/react'
import { useRef } from 'react'

import { cn } from '@/lib/utils'

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const CORNERS: Corner[] = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]

const CORNER_CLASSES: Record<Corner, string> = {
  'top-left': '-top-1 -left-1 cursor-nwse-resize',
  'top-right': '-top-1 -right-1 cursor-nesw-resize',
  'bottom-left': '-bottom-1 -left-1 cursor-nesw-resize',
  'bottom-right': '-bottom-1 -right-1 cursor-nwse-resize',
}

export function ResizableImageComponent({
  node,
  updateAttributes,
  selected,
}: NodeViewProps) {
  const wrapperRef = useRef<HTMLElement | null>(null)

  const startResize = (corner: Corner) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const img = wrapperRef.current?.querySelector('img')
    if (!img) return

    const startX = e.clientX
    const startWidth = img.offsetWidth
    const startHeight = img.offsetHeight
    const ratio = startHeight / startWidth
    const sign = corner.endsWith('left') ? -1 : 1

    const onMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX
      const newWidth = Math.max(40, Math.round(startWidth + dx * sign))
      updateAttributes({
        width: newWidth,
        height: Math.round(newWidth * ratio),
      })
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <NodeViewWrapper
      as="div"
      className="relative inline-block"
      ref={wrapperRef}
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ''}
        width={node.attrs.width || undefined}
        height={node.attrs.height || undefined}
        className={cn('max-w-full rounded', selected && 'ring-primary ring-2')}
        draggable={false}
      />
      {selected &&
        CORNERS.map((corner) => (
          <span
            key={corner}
            onMouseDown={startResize(corner)}
            className={cn(
              'border-primary bg-background absolute z-10 size-2.5 rounded-full border-2',
              CORNER_CLASSES[corner],
            )}
          />
        ))}
    </NodeViewWrapper>
  )
}
