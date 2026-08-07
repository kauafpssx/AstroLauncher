import { json } from '@codemirror/lang-json'
import { EditorView } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import type { Extension } from '@uiw/react-codemirror'

import { cn } from '@/lib/utils'

export type CodeEditorLanguage = 'json' | 'plain'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: CodeEditorLanguage
  disabled?: boolean
  className?: string
}

const EXTENSIONS: Record<CodeEditorLanguage, Extension[]> = {
  json: [json()],
  plain: [],
}

/**
 * Overrides just the editor's background to match the app instead of CodeMirror's
 * default dark preset background: token colors stay the built-in default.
 * `!important` is required: the built-in "dark" theme's stylesheet is injected
 * after this extension's, so without it the preset's own background silently wins.
 */
const backgroundOverride = EditorView.theme(
  {
    '&': { backgroundColor: 'var(--background) !important' },
    '.cm-gutters': {
      backgroundColor: 'var(--background) !important',
      borderRight: '1px solid var(--border)',
    },
  },
  { dark: true },
)

export function CodeEditor({
  value,
  onChange,
  language = 'plain',
  disabled,
  className,
}: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      editable={!disabled}
      theme="dark"
      height="100%"
      extensions={[...EXTENSIONS[language], backgroundOverride]}
      basicSetup={{ foldGutter: true, highlightActiveLine: !disabled }}
      className={cn('overflow-hidden rounded-md border text-xs', className)}
    />
  )
}
