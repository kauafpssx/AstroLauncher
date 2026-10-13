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
