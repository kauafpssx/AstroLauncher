import { ChevronDown, Image, LayoutGrid, Pencil } from 'lucide-react'
import { useState } from 'react'

import { useDroppable } from '@dnd-kit/core'

import { EntityContextMenu } from '@/components/common/EntityContextMenu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { resolveIconSrc } from '@/lib/icon-src'
import { cn } from '@/lib/utils'
import type { FolderDTO } from '@/types/folder'
import type { InstanceDTO } from '@/types/instance'

import { IconPickerDialog } from './IconPickerDialog'
import { InstanceCardGrid } from './InstanceCardGrid'

interface GroupSectionProps {
  name: string
  iconPath: string | null
  instances: InstanceDTO[]
  folders: FolderDTO[]
  selectedId: string | null
  runningId: string | null
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onDuplicate: (id: string) => void
  onMoveToFolder: (id: string, folderId: string | null) => void
  onRename: () => void
  onPickIconPath: (iconPath: string) => void
}

export function GroupSection({
  name,
  iconPath,
  instances,
  folders,
  selectedId,
  runningId,
  onSelect,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onExport,
  onDuplicate,
  onMoveToFolder,
  onRename,
  onPickIconPath,
}: GroupSectionProps) {
  const [open, setOpen] = useState(true)
  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: 'root',
    data: { type: 'drop-zone' },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg transition-colors',
        isOver && 'bg-accent/40 ring-primary/30 ring-2',
      )}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <EntityContextMenu
          stopPropagation
          items={[
            {
              key: 'rename',
              icon: Pencil,
              label: 'Renomear',
              onSelect: onRename,
            },
            {
              key: 'icon',
              icon: Image,
              label: 'Escolher Ícone',
              onSelect: () => setIconPickerOpen(true),
            },
          ]}
        >
          <CollapsibleTrigger className="text-muted-foreground hover:bg-accent/50 hover:text-foreground flex w-full items-center gap-1.5 rounded-md py-2 pr-1 text-sm font-medium">
            <ChevronDown
              className={cn(
                'size-4 transition-transform',
                !open && '-rotate-90',
              )}
            />
            {iconPath ? (
              <img
                src={resolveIconSrc(iconPath)}
                alt=""
                className="size-4 [image-rendering:pixelated]"
              />
            ) : (
              <LayoutGrid className="size-4" />
            )}
            {name}
            <span className="text-muted-foreground text-xs">
              ({instances.length})
            </span>
          </CollapsibleTrigger>
        </EntityContextMenu>
        <CollapsibleContent>
          <InstanceCardGrid
            instances={instances}
            selectedId={selectedId}
            runningId={runningId}
            folders={folders}
            emptyHint="Nenhuma instância fora de pastas. Arraste para cá para sair de uma pasta."
            onSelect={onSelect}
            onLaunch={onLaunch}
            onStop={onStop}
            onEdit={onEdit}
            onDelete={onDelete}
            onExport={onExport}
            onDuplicate={onDuplicate}
            onMoveToFolder={onMoveToFolder}
          />
        </CollapsibleContent>
      </Collapsible>
      <IconPickerDialog
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        onSelect={onPickIconPath}
      />
    </div>
  )
}
