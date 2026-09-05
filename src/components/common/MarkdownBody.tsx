import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { useLinkPreviewStore } from '@/stores/link-preview.store'
const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'center', 'sup', 'sub'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'id', 'align'],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'src',
      'alt',
      'title',
      'width',
      'height',
    ],
  },
}
interface MarkdownBodyProps {
  children: string
  className?: string
}
export function MarkdownBody({ children, className }: MarkdownBodyProps) {
  const openLink = useLinkPreviewStore((s) => s.open)
  return (
    <div
      className={cn(
        'prose-blockquote:text-foreground prose-blockquote:not-italic',
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
        components={{
          a: ({ href, children: linkChildren, ...props }) => (
            <a
              {...props}
              href={href}
              onClick={(e) => {
                if (!href) return
                e.preventDefault()
                openLink(href)
              }}
            >
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  )
}
