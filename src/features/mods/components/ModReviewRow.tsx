import { Check, Loader2, X } from 'lucide-react'

import { EntityAvatar } from '@/components/common/EntityAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { tooltipProps } from '@/lib/tooltip'

import type { EntryStatus, ReviewEntry } from './mod-review.types'

interface ModReviewRowProps {
  entry: ReviewEntry
  status: EntryStatus | undefined
  isInstalling: boolean
  onRemove: (key: string) => void
}

export function ModReviewRow({
  entry,
  status,
  isInstalling,
  onRemove,
}: ModReviewRowProps) {
  return (
    <div className="hover:bg-accent flex items-center gap-3 rounded-lg p-2">
      <EntityAvatar
        name={entry.result.name}
        iconUrl={entry.result.iconUrl}
        className="size-9"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{entry.result.name}</p>
          {entry.isDependency && (
            <Badge variant="outline" className="shrink-0 text-xs">
              dependência
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground truncate text-xs">
          {entry.version.name}
        </p>
      </div>
      {status === 'installing' && (
        <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
      )}
      {status === 'done' && <Check className="text-primary size-4 shrink-0" />}
      {status === 'failed' && (
        <X className="text-destructive size-4 shrink-0" />
      )}
      {!status && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(entry.key)}
          disabled={isInstalling}
          aria-label="Remover"
          {...tooltipProps('Remover')}
        >
          <X />
        </Button>
      )}
    </div>
  )
}
