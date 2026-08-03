import type { CodeEditorLanguage } from '@/components/common/CodeEditor'

export function languageForPath(path: string | null): CodeEditorLanguage {
  return path?.endsWith('.json') ? 'json' : 'plain'
}
