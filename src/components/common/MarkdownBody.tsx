import Markdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'
import { useLinkPreviewStore } from '@/stores/link-preview.store'

// Modrinth/CurseForge descriptions often mix raw HTML into the markdown
// (centered images, anchor ids on headings, <sup> footnotes) — extend the
// default sanitize schema instead of dropping it, so it renders instead of
// vanishing.
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

/** Renders project markdown/HTML and opens every link in the in-app preview modal instead of a new OS window. */
export function MarkdownBody({ children, className }: MarkdownBodyProps) {
  const openLink = useLinkPreviewStore((s) => s.open)

  return (
    // Some project descriptions embed raw HTML/blockquotes styled for a
    // light background — force blockquote text to the theme's own color
    // instead of trusting the source's (often invisible-on-dark) styling.
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
