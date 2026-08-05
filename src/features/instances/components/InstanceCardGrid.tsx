import { useDroppable } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { cn } from '@/lib/utils'
import type { FolderDTO } from '@/types/folder'
import type { InstanceDTO } from '@/types/instance'

import { InstanceCard } from './InstanceCard'

interface InstanceCardGridProps {
  droppableId?: string
  instances: InstanceDTO[]
  selectedId: string | null
  runningId: string | null
  folders: FolderDTO[]
  emptyHint?: string
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onDuplicate: (id: string) => void
  onMoveToFolder: (id: string, folderId: string | null) => void
}

export function InstanceCardGrid({
  droppableId,
  instances,
  selectedId,
  runningId,
  folders,
  emptyHint,
  onSelect,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onExport,
  onDuplicate,
  onMoveToFolder,
}: InstanceCardGridProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId ?? 'noop',
    data: { type: 'drop-zone' },
    disabled: !droppableId,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-6 flex-wrap gap-3 rounded-lg py-2 transition-colors',
        isOver && 'bg-accent/40 ring-primary/30 ring-2',
      )}
    >
      {instances.length === 0 && emptyHint && (
        <p className="text-muted-foreground self-center px-1 text-xs">
          {emptyHint}
        </p>
      )}
      <SortableContext items={instances.map((i) => i.id)}>
        {instances.map((instance) => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            selected={instance.id === selectedId}
            isRunning={instance.id === runningId}
            folders={folders}
            onSelect={onSelect}
            onLaunch={onLaunch}
            onStop={onStop}
            onEdit={onEdit}
            onDelete={onDelete}
            onExport={onExport}
            onDuplicate={onDuplicate}
            onMoveToFolder={onMoveToFolder}
          />
        ))}
      </SortableContext>
    </div>
  )
}
