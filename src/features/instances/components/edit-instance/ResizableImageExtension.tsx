import ImageExtension from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { useRef } from 'react'

import { cn } from '@/lib/utils'

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

const CORNER_CLASSES: Record<Corner, string> = {
  'top-left': '-top-1 -left-1 cursor-nwse-resize',
  'top-right': '-top-1 -right-1 cursor-nesw-resize',
  'bottom-left': '-bottom-1 -left-1 cursor-nesw-resize',
  'bottom-right': '-bottom-1 -right-1 cursor-nwse-resize',
}

function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
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
      updateAttributes({ width: newWidth, height: Math.round(newWidth * ratio) })
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <NodeViewWrapper as="div" className="relative inline-block" ref={wrapperRef}>
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ''}
        width={node.attrs.width || undefined}
        height={node.attrs.height || undefined}
        className={cn('max-w-full rounded', selected && 'ring-2 ring-primary')}
        draggable={false}
      />
      {selected &&
        CORNERS.map((corner) => (
          <span
            key={corner}
            onMouseDown={startResize(corner)}
            className={cn('absolute z-10 size-2.5 rounded-full border-2 border-primary bg-background', CORNER_CLASSES[corner])}
          />
        ))}
    </NodeViewWrapper>
  )
}

export const ResizableImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
  // tiptap-markdown's built-in image serializer only knows src/alt/title —
  // width/height (set via drag-resize) would silently get dropped on every
  // save, so the resized size never survives a reload. Write a raw <img>
  // tag instead whenever a custom size is set, since plain markdown image
  // syntax has no way to encode dimensions.
  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (text: string) => void; closeBlock: (node: unknown) => void }, node: { attrs: Record<string, unknown> }) {
          const { src, alt, title, width, height } = node.attrs as {
            src: string
            alt?: string | null
            title?: string | null
            width?: number | null
            height?: number | null
          }

          if (width || height) {
            const attrs = [`src="${src}"`]
            if (alt) attrs.push(`alt="${alt}"`)
            if (title) attrs.push(`title="${title}"`)
            if (width) attrs.push(`width="${width}"`)
            if (height) attrs.push(`height="${height}"`)
            state.write(`<img ${attrs.join(' ')} />`)
          } else {
            const titlePart = title ? ` "${title}"` : ''
            state.write(`![${alt ?? ''}](${src}${titlePart})`)
          }
          state.closeBlock(node)
        },
      },
    }
  },
})
