import { Package, Play } from 'lucide-react'

import { EntityContextMenu } from '@/components/common/EntityContextMenu'
import { cn } from '@/lib/utils'
import type { InstanceDTO } from '@/types/instance'

import { getInstanceActions } from '../lib/instance-actions'

interface InstanceCardProps {
  instance: InstanceDTO
  selected: boolean
  isRunning: boolean
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
}

export function InstanceCard({ instance, selected, isRunning, onSelect, onLaunch, onStop, onEdit, onDelete, onExport }: InstanceCardProps) {
  return (
    <EntityContextMenu actions={getInstanceActions(instance, { onLaunch, onStop, onEdit, onDelete, onExport }, isRunning)}>
      <button
        type="button"
        onClick={() => onSelect(instance.id)}
        onDoubleClick={() => (isRunning ? onStop(instance.id) : onLaunch(instance.id))}
        className={cn(
          'flex w-28 flex-col items-center gap-2 rounded-lg border border-transparent p-2 text-center transition-colors hover:bg-accent',
          selected && 'border-primary bg-accent',
        )}
      >
        <div className="relative flex size-16 items-center justify-center rounded-md bg-muted">
          {instance.iconPath ? (
            <img src={instance.iconPath} alt="" className="size-full rounded-md object-cover" />
          ) : (
            <Package className="size-8 text-muted-foreground" />
          )}
          {isRunning && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Play className="size-2.5 fill-current" />
            </span>
          )}
        </div>
        <span className="line-clamp-2 w-full text-xs font-medium break-words">{instance.name}</span>
      </button>
    </EntityContextMenu>
  )
}
