import { Check, Loader2, X } from 'lucide-react'
import type { RefObject } from 'react'

import { EntityAvatar } from '@/components/common/EntityAvatar'
import { ProgressGroup } from '@/components/common/ProgressGroup'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { tooltipProps } from '@/lib/tooltip'

interface InstalledFile {
  name: string
  iconUrl: string | null
}

interface ModpackInstallProgressProps {
  isDone: boolean
  isInstalling: boolean
  percent: number
  progress: { current: number; total: number }
  installedFiles: InstalledFile[]
  filesEndRef: RefObject<HTMLDivElement | null>
  onRequestCancel: () => void
}

export function ModpackInstallProgress({
  isDone,
  isInstalling,
  percent,
  progress,
  installedFiles,
  filesEndRef,
  onRequestCancel,
}: ModpackInstallProgressProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        <ProgressGroup
          className="flex-1"
          label={isDone ? 'Modpack instalado' : 'Instalando modpack'}
          value={percent}
          rightLabel={`${progress.current}/${progress.total}`}
        />
        {isInstalling && !isDone && (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            {...tooltipProps('Parar instalação')}
            onClick={onRequestCancel}
          >
            <X />
          </Button>
        )}
      </div>
      <ScrollArea type="always" className="h-32 rounded-lg border">
        <div className="flex flex-col gap-0.5 p-1 pr-2">
          {installedFiles.map((file, i) => {
            const isLast = i === installedFiles.length - 1 && !isDone
            return (
              <div
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <EntityAvatar
                  name={file.name}
                  iconUrl={file.iconUrl}
                  className="size-6 shrink-0"
                />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                {isLast ? (
                  <Loader2 className="text-muted-foreground size-3.5 shrink-0 animate-spin" />
                ) : (
                  <Check className="text-primary size-3.5 shrink-0" />
                )}
              </div>
            )
          })}
          <div ref={filesEndRef} />
        </div>
      </ScrollArea>
    </>
  )
}
