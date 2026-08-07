import { Check } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ModVersion } from '@/types/mods'

interface ModpackVersionPickerProps {
  versions: ModVersion[]
  selectedVersion: ModVersion | null
  onSelect: (version: ModVersion) => void
}

export function ModpackVersionPicker({
  versions,
  selectedVersion,
  onSelect,
}: ModpackVersionPickerProps) {
  return (
    <ScrollArea type="always" className="h-40 rounded-lg border">
      <div className="flex flex-col gap-1 p-1 pr-2">
        {versions.length === 0 && (
          <p className="text-muted-foreground p-3 text-center text-sm">
            Nenhuma versão encontrada.
          </p>
        )}
        {versions.map((version) => {
          const unavailable = !version.downloadUrl
          const isActive = selectedVersion?.id === version.id
          return (
            <button
              key={version.id}
              type="button"
              disabled={unavailable}
              onClick={() => onSelect(version)}
              className="group hover:bg-accent data-[active=true]:bg-accent flex w-full items-center justify-between rounded-md p-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              data-active={isActive}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{version.name}</span>
                {version.gameVersions[0] && (
                  <Badge
                    variant={isActive ? 'default' : 'secondary'}
                    className={cn(
                      'shrink-0',
                      !isActive &&
                        'group-hover:bg-primary group-hover:text-primary-foreground',
                    )}
                  >
                    {version.gameVersions[0]}
                  </Badge>
                )}
              </span>
              {unavailable ? (
                <span className="text-muted-foreground shrink-0 text-xs">
                  indisponível
                </span>
              ) : (
                isActive && <Check className="text-primary size-3.5 shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
