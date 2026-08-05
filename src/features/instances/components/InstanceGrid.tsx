import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Download, FolderPlus, Plus, RefreshCw } from 'lucide-react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useContextMenuStore } from '@/stores/context-menu.store'
import type { FolderDTO } from '@/types/folder'
import type { InstanceDTO } from '@/types/instance'

import { EmptyInstances } from './EmptyInstances'
import { FolderSection } from './FolderSection'
import { GroupSection } from './GroupSection'
import {
  collisionDetection,
  GRID_BACKGROUND_MENU_ID,
  handleInstanceDragEnd,
} from './instance-grid-dnd'

interface InstanceGridProps {
  instances: InstanceDTO[]
  folders: FolderDTO[]
  rootGroupName: string
  rootGroupIcon: string | null
  selectedId: string | null
  runningId: string | null
  onSelect: (id: string) => void
  onLaunch: (id: string) => void
  onStop: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onDuplicate: (id: string) => void
  onImport: () => void
  onCreate: () => void
  onCreateFolder: () => void
  onRenameFolder: (folderId: string) => void
  onDeleteFolder: (folder: FolderDTO) => void
  onRenameRoot: () => void
  onPickRootIcon: (iconPath: string) => void
  onToggleCollapsed: (folderId: string, collapsed: boolean) => void
  onMoveToFolder: (instanceId: string, folderId: string | null) => void
  onReorderFolders: (orderedIds: string[]) => void
  onReorderInstances: (orderedIds: string[]) => void
  onRefresh: () => void
}

export function InstanceGrid({
  instances,
  folders,
  rootGroupName,
  rootGroupIcon,
  selectedId,
  runningId,
  onSelect,
  onLaunch,
  onStop,
  onEdit,
  onDelete,
  onExport,
  onDuplicate,
  onImport,
  onCreate,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRenameRoot,
  onPickRootIcon,
  onToggleCollapsed,
  onMoveToFolder,
  onReorderFolders,
  onReorderInstances,
  onRefresh,
}: InstanceGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  )
  const isBackgroundMenuOpen = useContextMenuStore(
    (s) => s.openId === GRID_BACKGROUND_MENU_ID,
  )
  const setOpenContextMenuId = useContextMenuStore((s) => s.setOpenId)

  if (instances.length === 0 && folders.length === 0) {
    return <EmptyInstances onCreate={onCreate} onImport={onImport} />
  }

  const ungrouped = instances.filter((i) => i.folderId === null)
  const folderInstances = (folderId: string) =>
    instances.filter((i) => i.folderId === folderId)

  const handleDragEnd = (event: DragEndEvent) =>
    handleInstanceDragEnd(event, {
      folders,
      instances,
      onMoveToFolder,
      onReorderFolders,
      onReorderInstances,
    })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragEnd={handleDragEnd}
    >
      <ContextMenu
        open={isBackgroundMenuOpen}
        onOpenChange={(next) =>
          setOpenContextMenuId(next ? GRID_BACKGROUND_MENU_ID : null)
        }
      >
        <ContextMenuTrigger asChild>
          <div className="flex min-h-full flex-col px-4">
            <SortableContext
              items={folders.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {folders.map((folder) => (
                <FolderSection
                  key={folder.id}
                  folder={folder}
                  instances={folderInstances(folder.id)}
                  folders={folders}
                  selectedId={selectedId}
                  runningId={runningId}
                  onToggleCollapsed={(collapsed) =>
                    onToggleCollapsed(folder.id, collapsed)
                  }
                  onRename={() => onRenameFolder(folder.id)}
                  onDelete={() => onDeleteFolder(folder)}
                  onSelect={onSelect}
                  onLaunch={onLaunch}
                  onStop={onStop}
                  onEdit={onEdit}
                  onDeleteInstance={onDelete}
                  onExport={onExport}
                  onDuplicate={onDuplicate}
                  onMoveToFolder={onMoveToFolder}
                  onCreateFolder={onCreateFolder}
                />
              ))}
            </SortableContext>
            <GroupSection
              name={rootGroupName}
              iconPath={rootGroupIcon}
              instances={ungrouped}
              folders={folders}
              selectedId={selectedId}
              runningId={runningId}
              onSelect={onSelect}
              onLaunch={onLaunch}
              onStop={onStop}
              onEdit={onEdit}
              onDelete={onDelete}
              onExport={onExport}
              onDuplicate={onDuplicate}
              onMoveToFolder={onMoveToFolder}
              onRename={onRenameRoot}
              onPickIconPath={onPickRootIcon}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={onCreateFolder}>
            <FolderPlus /> Nova Pasta
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={onCreate}>
            <Plus /> Nova Instância
          </ContextMenuItem>
          <ContextMenuItem onSelect={onImport}>
            <Download /> Importar .astropack
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={onRefresh}>
            <RefreshCw /> Recarregar
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </DndContext>
  )
}
