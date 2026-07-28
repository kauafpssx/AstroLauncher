import { Package } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { InstanceDTO } from '@/types/instance'

import { getInstanceActions } from '../lib/instance-actions'

interface InstanceSidebarProps {
  instance: InstanceDTO
  isRunning: boolean
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
}

export function InstanceSidebar({ instance, isRunning, onLaunch, onStop, onEdit, onDelete, onExport }: InstanceSidebarProps) {
  const actions = getInstanceActions(instance, { onLaunch, onStop, onEdit, onDelete, onExport }, isRunning)
  const [primaryAction, ...rest] = actions
  const deleteAction = rest.find((a) => a.key === 'delete')!
  const secondaryActions = rest.filter((a) => a.key !== 'delete')

  return (
    <aside className="flex w-56 shrink-0 flex-col gap-4 border-l p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-20 items-center justify-center rounded-md bg-muted">
          {instance.iconPath ? (
            <img src={instance.iconPath} alt="" className="size-full rounded-md object-cover" />
          ) : (
            <Package className="size-10 text-muted-foreground" />
          )}
        </div>
        <span className="font-medium">{instance.name}</span>
        <span className="text-xs text-muted-foreground">{instance.version}</span>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant={primaryAction.key === 'stop' ? 'destructive' : 'default'}
          onClick={primaryAction.onSelect}
        >
          <primaryAction.icon /> {primaryAction.label}
        </Button>
      </div>

      <Separator />

      <div className="flex flex-col gap-1">
        {secondaryActions.map(({ key, icon: Icon, label, onSelect }) => (
          <Button key={key} variant="ghost" className="justify-start" onClick={onSelect}>
            <Icon /> {label}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="justify-start text-destructive hover:text-destructive"
          onClick={deleteAction.onSelect}
        >
          <deleteAction.icon /> {deleteAction.label}
        </Button>
      </div>
    </aside>
  )
}
