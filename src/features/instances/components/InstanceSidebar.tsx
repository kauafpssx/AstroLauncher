import { Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatDateTime, formatDuration, parseLauncherDate } from '@/lib/format'
import type { InstanceDTO } from '@/types/instance'

import { useInstanceIcon } from '../hooks/useInstanceIcon'
import { usePlaytimeSummary } from '../hooks/usePlaytimeSummary'
import { getInstanceActions } from '../lib/instance-actions'
import { IconPickerButton } from './IconPickerButton'

interface InstanceSidebarProps {
  instance: InstanceDTO
  isRunning: boolean
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
}

export function InstanceSidebar({
  instance,
  isRunning,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onExport,
}: InstanceSidebarProps) {
  const { handleIconSelect } = useInstanceIcon(instance)
  const { summary } = usePlaytimeSummary(instance, isRunning)
  const { actions } = getInstanceActions(
    instance,
    { onLaunch, onStop, onEdit, onDelete, onExport },
    isRunning,
  )
  const [primaryAction, ...rest] = actions
  const deleteAction = rest.find((a) => a.key === 'delete')!
  const secondaryActions = rest.filter((a) => a.key !== 'delete')

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-4 border-l p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <IconPickerButton
          iconPath={instance.iconPath}
          onSelect={handleIconSelect}
          className="size-20"
          fallbackIconClassName="size-10"
        />
        <span className="font-medium">{instance.name}</span>
        <span className="text-muted-foreground text-xs">
          {instance.version}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant={primaryAction.key === 'stop' ? 'destructive' : 'default'}
          onClick={primaryAction.onSelect}
        >
          <primaryAction.icon /> {primaryAction.label}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {secondaryActions.map(({ key, icon: Icon, label, onSelect }) => (
          <Button
            key={key}
            variant="ghost"
            className="justify-start"
            onClick={onSelect}
          >
            <Icon /> {label}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive justify-start"
          onClick={deleteAction.onSelect}
        >
          <deleteAction.icon /> {deleteAction.label}
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Clock className="size-3.5" />
          Tempo de jogo
          {isRunning && (
            <span className="bg-primary/70 text-primary-foreground ml-auto inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
              <span className="bg-primary-foreground size-1.5 animate-pulse rounded-full" />
              Ao vivo
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Tempo jogado</span>
            <span>{summary ? formatDuration(summary.totalSeconds) : '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Última vez jogado</span>
            <span className="text-right">
              {summary?.lastPlayed
                ? formatDateTime(parseLauncherDate(summary.lastPlayed))
                : 'Nunca'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Última sessão</span>
            <span>
              {summary?.lastSessionSeconds != null
                ? formatDuration(summary.lastSessionSeconds)
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
