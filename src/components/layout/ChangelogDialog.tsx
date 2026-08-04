import { useEffect, useRef, useState } from 'react'

import { MarkdownBody } from '@/components/common/MarkdownBody'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { getAppEnvConfig } from '@/lib/app-config'

// Bundled at build time — every `.github/releases/vX.Y.Z.md` file becomes
// part of the app itself, so the changelog works fully offline.
const modules = import.meta.glob('../../../.github/releases/v*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

interface ChangelogEntry {
  version: string
  content: string
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

function buildEntries(repo: string): ChangelogEntry[] {
  return Object.entries(modules)
    .map(([path, raw]) => {
      const match = path.match(/v(\d+\.\d+\.\d+)\.md$/)
      if (!match) return null
      const version = match[1]
      // The same placeholders the CI release workflow fills in before
      // publishing to GitHub Releases — the raw files in the repo still have
      // them literally, so mirror that substitution here.
      const content = raw
        .replaceAll('{{tag}}', `v${version}`)
        .replaceAll('{{version}}', version)
        .replaceAll(
          '{{changelog_url}}',
          `https://github.com/${repo}/commits/v${version}`,
        )
      return { version, content }
    })
    .filter((e): e is ChangelogEntry => e !== null)
    .sort((a, b) => compareVersions(b.version, a.version))
}

interface ChangelogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const contentViewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    getAppEnvConfig().then((config) => {
      if (!active) return
      const built = buildEntries(config.githubRepo)
      setEntries(built)
      setSelected((current) => current ?? built[0]?.version ?? null)
    })
    return () => {
      active = false
    }
  }, [])

  const active = entries.find((e) => e.version === selected) ?? entries[0]

  // Switching versions swaps the markdown in place — the scroll position
  // from the previous one otherwise carries over instead of starting at
  // the top of the new content.
  useEffect(() => {
    contentViewportRef.current?.scrollTo({ top: 0 })
  }, [selected])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[80vh] max-h-[720px] flex-col gap-0 p-0 sm:max-w-3xl"
      >
        <DialogHeader className="border-b p-4">
          <DialogTitle>Changelog</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-36 shrink-0 flex-col border-r p-2">
            <ScrollArea type="always" className="min-h-0 flex-1">
              <div className="flex flex-col gap-0.5 pr-2">
                {entries.map((entry) => (
                  <button
                    key={entry.version}
                    type="button"
                    onClick={() => setSelected(entry.version)}
                    className={cn(
                      'hover:bg-accent rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors',
                      active?.version === entry.version &&
                        'bg-primary/10 text-primary',
                    )}
                  >
                    v{entry.version}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>

          <ScrollArea
            type="always"
            className="min-h-0 flex-1"
            viewportRef={contentViewportRef}
          >
            <div className="p-6">
              {active ? (
                <MarkdownBody className="prose prose-sm dark:prose-invert max-w-none">
                  {active.content}
                </MarkdownBody>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nenhum changelog disponível.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
