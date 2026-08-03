import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Play } from 'lucide-react'

import { EntityContextMenu } from '@/components/common/EntityContextMenu'
import { cn } from '@/lib/utils'
import type { FolderDTO } from '@/types/folder'
import type { InstanceDTO } from '@/types/instance'

import { useInstanceIcon } from '../hooks/useInstanceIcon'
import { getInstanceActions } from '../lib/instance-actions'
import { IconPickerButton } from './IconPickerButton'

interface InstanceCardProps {
  instance: InstanceDTO
  selected: boolean
  isRunning: boolean
  folders: FolderDTO[]
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onMoveToFolder: (id: string, folderId: string | null) => void
}

export function InstanceCard({
  instance,
  selected,
  isRunning,
  folders,
  onSelect,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onExport,
  onMoveToFolder,
}: InstanceCardProps) {
  const { handleIconSelect } = useInstanceIcon(instance)
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: instance.id,
    data: { type: 'instance', folderId: instance.folderId },
  })

  const { actions, submenus } = getInstanceActions(
    instance,
    {
      onLaunch,
      onStop,
      onEdit,
      onDelete,
      onExport,
      onMoveToFolder,
    },
    isRunning,
    folders,
  )

  return (
    <>
      <EntityContextMenu actions={actions} submenus={submenus} stopPropagation>
        <div
          ref={setNodeRef}
          style={{ transform: CSS.Transform.toString(transform), transition }}
          {...attributes}
          {...listeners}
          onClick={() => onSelect(instance.id)}
          onDoubleClick={() =>
            isRunning ? onStop(instance.id) : onLaunch(instance.id)
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelect(instance.id)
          }}
          className={cn(
            'hover:bg-accent flex w-28 cursor-grab flex-col items-center gap-2 rounded-lg border border-transparent p-2 text-center transition-colors active:cursor-grabbing',
            selected && 'border-primary bg-accent',
            isDragging && 'border-primary bg-accent relative z-10 shadow-md',
          )}
        >
          <IconPickerButton
            iconPath={instance.iconPath}
            onSelect={handleIconSelect}
            className="size-16"
            fallbackIconClassName="size-8"
            clickOpensPicker={false}
            onDoubleClick={() =>
              isRunning ? onStop(instance.id) : onLaunch(instance.id)
            }
            overlay={
              isRunning && (
                <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full">
                  <Play className="size-2.5 fill-current" />
                </span>
              )
            }
          />
          <span className="line-clamp-2 w-full text-xs font-medium break-words">
            {instance.name}
          </span>
        </div>
      </EntityContextMenu>
    </>
  )
}
