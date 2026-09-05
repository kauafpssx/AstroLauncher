import ImageExtension from '@tiptap/extension-image'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { ResizableImageComponent } from './ResizableImageNodeView'
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
  addStorage() {
    return {
      markdown: {
        serialize(
          state: {
            write: (text: string) => void
            closeBlock: (node: unknown) => void
          },
          node: {
            attrs: Record<string, unknown>
          },
        ) {
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
