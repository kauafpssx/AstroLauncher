import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, Folder } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { EntityContextMenu } from '@/components/common/EntityContextMenu'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { resolveIconSrc } from '@/lib/icon-src'
import { cn } from '@/lib/utils'
import { useFolderStore } from '@/stores/folder.store'
import type { FolderDTO } from '@/types/folder'
import type { InstanceDTO } from '@/types/instance'

import { buildFolderHeaderActions } from './folder-section-actions'
import { IconPickerDialog } from './IconPickerDialog'
import { InstanceCardGrid } from './InstanceCardGrid'

interface FolderSectionProps {
  folder: FolderDTO
  instances: InstanceDTO[]
  folders: FolderDTO[]
  selectedId: string | null
  runningId: string | null
  onToggleCollapsed: (collapsed: boolean) => void
  onRename: () => void
  onDelete: () => void
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDeleteInstance: (id: string) => void
  onExport: (id: string) => void
  onDuplicate: (id: string) => void
  onMoveToFolder: (id: string, folderId: string | null) => void
  onCreateFolder: () => void
}

export function FolderSection({
  folder,
  instances,
  folders,
  selectedId,
  runningId,
  onToggleCollapsed,
  onRename,
  onDelete,
  onSelect,
  onLaunch,
  onStop,
  onEdit,
  onDeleteInstance,
  onExport,
  onDuplicate,
  onMoveToFolder,
  onCreateFolder,
}: FolderSectionProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folder.id,
    data: { type: 'folder' },
  })

  const [iconPickerOpen, setIconPickerOpen] = useState(false)
  const updateFolder = useFolderStore((s) => s.updateFolder)
  const dragHappened = useRef(false)

  useEffect(() => {
    if (isDragging) dragHappened.current = true
  }, [isDragging])

  const collapsed = folder.collapsed

  const handleHeaderClick = () => {
    if (dragHappened.current) {
      dragHappened.current = false
      return
    }
    onToggleCollapsed(!collapsed)
  }

  const headerActions = buildFolderHeaderActions({
    onCreateFolder,
    onRename,
    onPickIcon: () => setIconPickerOpen(true),
    onDelete,
  })

  const handleIconSelect = async (iconPath: string) => {
    try {
      await updateFolder({
        id: folder.id,
        name: folder.name,
        collapsed: folder.collapsed,
        iconPath,
      })
    } catch (err) {
      toast.error(`Falha ao atualizar ícone: ${String(err)}`)
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          'rounded-lg',
          isDragging && 'bg-muted relative z-10 shadow-md',
        )}
      >
        <Collapsible
          open={!collapsed}
          onOpenChange={(open) => onToggleCollapsed(!open)}
        >
          <EntityContextMenu items={headerActions} stopPropagation>
            <button
              type="button"
              {...attributes}
              {...listeners}
              onClick={handleHeaderClick}
              className="text-muted-foreground hover:text-foreground flex w-full cursor-grab touch-none items-center gap-1.5 rounded-md py-2 pr-1 text-left text-sm font-medium active:cursor-grabbing"
            >
              <ChevronDown
                className={cn(
                  'size-4 transition-transform',
                  collapsed && '-rotate-90',
                )}
              />
              {folder.iconPath ? (
                <img
                  src={resolveIconSrc(folder.iconPath)}
                  alt=""
                  className="size-4 [image-rendering:pixelated]"
                />
              ) : (
                <Folder className="size-4" />
              )}
              {folder.name}
              <span className="text-muted-foreground text-xs">
                ({instances.length})
              </span>
            </button>
          </EntityContextMenu>
          <CollapsibleContent>
            <InstanceCardGrid
              droppableId={`folder:${folder.id}`}
              instances={instances}
              selectedId={selectedId}
              runningId={runningId}
              folders={folders}
              emptyHint="Arraste instâncias para cá"
              onSelect={onSelect}
              onLaunch={onLaunch}
              onStop={onStop}
              onEdit={onEdit}
              onDelete={onDeleteInstance}
              onExport={onExport}
              onDuplicate={onDuplicate}
              onMoveToFolder={onMoveToFolder}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>
      <IconPickerDialog
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        onSelect={handleIconSelect}
      />
    </>
  )
}
