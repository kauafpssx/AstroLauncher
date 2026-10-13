import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { MarkdownBody } from '@/components/common/MarkdownBody'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { SettingsAPI } from '@/features/settings/services/settings.api'
import { cn } from '@/lib/utils'
import { getAppEnvConfig } from '@/lib/app-config'
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
function buildEntries(githubBase: string, repo: string): ChangelogEntry[] {
  const base = githubBase.replace(/\/+$/, '')
  return Object.entries(modules)
    .map(([path, raw]) => {
      const match = path.match(/v(\d+\.\d+\.\d+)\.md$/)
      if (!match) return null
      const version = match[1]
      const content = raw
        .replaceAll('{{tag}}', `v${version}`)
        .replaceAll('{{version}}', version)
        .replaceAll('{{changelog_url}}', `${base}/${repo}/commits/v${version}`)
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
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean | null>(
    null,
  )
  const [isTogglingUpdate, setIsTogglingUpdate] = useState(false)
  const contentViewportRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let active = true
    getAppEnvConfig().then((config) => {
      if (!active) return
      const built = buildEntries(config.githubBase, config.githubRepo)
      setEntries(built)
      setSelected((current) => current ?? built[0]?.version ?? null)
    })
    return () => {
      active = false
    }
  }, [])
  const active = entries.find((e) => e.version === selected) ?? entries[0]
  useEffect(() => {
    contentViewportRef.current?.scrollTo({ top: 0 })
  }, [selected])
  useEffect(() => {
    if (!open) return
    let cancelled = false
    SettingsAPI.get()
      .then((settings) => {
        if (!cancelled) setAutoUpdateEnabled(settings.autoUpdateEnabled)
      })
      .catch(() => {
        if (!cancelled) setAutoUpdateEnabled(true)
      })
    return () => {
      cancelled = true
    }
  }, [open])
  const handleAutoUpdateChange = async (next: boolean) => {
    setIsTogglingUpdate(true)
    try {
      const current = await SettingsAPI.get()
      const updated = await SettingsAPI.update({
        curseforgeApiKey: current.curseforgeApiKey,
        mcstatApiKey: current.mcstatApiKey,
        autoUpdateEnabled: next,
      })
      setAutoUpdateEnabled(updated.autoUpdateEnabled)
    } catch (err) {
      toast.error(`Falha ao atualizar: ${String(err)}`)
    } finally {
      setIsTogglingUpdate(false)
    }
  }
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
          <aside className="flex w-36 shrink-0 flex-col border-r">
            <ScrollArea type="always" className="min-h-0 flex-1">
              <div className="flex flex-col gap-0.5 p-2 pr-2">
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
            <div className="border-t p-2">
              <div className="flex items-center justify-between gap-2 rounded-md px-1 py-1">
                <span className="text-muted-foreground text-xs leading-tight font-medium">
                  Atualizações automáticas
                </span>
                <Switch
                  size="sm"
                  checked={autoUpdateEnabled ?? true}
                  disabled={autoUpdateEnabled === null || isTogglingUpdate}
                  onCheckedChange={handleAutoUpdateChange}
                  aria-label="Atualizações automáticas"
                />
              </div>
            </div>
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
