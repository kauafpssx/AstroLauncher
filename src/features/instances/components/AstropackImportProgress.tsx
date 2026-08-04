import { Check, Loader2, X } from 'lucide-react'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { ProgressGroup } from '@/components/common/ProgressGroup'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { groupByContentKind } from '@/lib/content-kind'

import type { EntryProgress } from './useAstropackImport'

const OTHER_KIND_LABELS: Record<string, string> = {
  world: 'Mundos',
  screenshot: 'Screenshots',
}

function groupOtherKinds(entries: EntryProgress[]) {
  return Object.entries(OTHER_KIND_LABELS)
    .map(([kind, label]) => ({
      kind,
      label,
      items: entries.filter((e) => e.kind === kind),
    }))
    .filter((group) => group.items.length > 0)
}

interface AstropackImportProgressProps {
  entries: EntryProgress[]
  current: number
  total: number
  overallPercent: number
  isImporting: boolean
  importError: string | null
  canClose: boolean
  onClose: () => void
}

export function AstropackImportProgress({
  entries,
  current,
  total,
  overallPercent,
  isImporting,
  importError,
  canClose,
  onClose,
}: AstropackImportProgressProps) {
  return (
    <div className="flex flex-col gap-4">
      <ProgressGroup
        label="Progresso geral"
        value={overallPercent}
        rightLabel={`${current}/${total}`}
      />

      {entries.length === 0 && isImporting ? (
        <CenteredSpinner className="py-6" iconClassName="size-5" />
      ) : (
        <ScrollArea className="max-h-72">
          <div className="flex flex-col gap-3">
            {[...groupByContentKind(entries), ...groupOtherKinds(entries)].map(
              (group) => (
                <div key={group.kind} className="flex flex-col gap-1">
                  <p className="text-muted-foreground px-2 text-xs font-medium">
                    {group.label}
                  </p>
                  {group.items.map((entry) => (
                    <div
                      key={entry.name}
                      className="hover:bg-accent flex items-center gap-3 rounded-lg p-2"
                    >
                      <EntityAvatar
                        name={entry.name}
                        iconUrl={entry.iconUrl}
                        className="size-7 shrink-0"
                        fallbackClassName="text-[10px]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{entry.name}</p>
                      </div>
                      {entry.status === 'pending' && (
                        <div className="size-4 shrink-0" />
                      )}
                      {entry.status === 'downloading' && (
                        <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                      )}
                      {entry.status === 'done' && (
                        <Check className="text-primary size-4 shrink-0" />
                      )}
                      {entry.status === 'failed' && (
                        <X className="text-destructive size-4 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>
        </ScrollArea>
      )}

      {importError && <p className="text-destructive text-xs">{importError}</p>}

      {canClose && <Button onClick={onClose}>Fechar</Button>}
    </div>
  )
}
