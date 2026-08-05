import {
  DndContext,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
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

const GRID_BACKGROUND_MENU_ID = 'instance-grid-background'

import { EmptyInstances } from './EmptyInstances'
import { FolderSection } from './FolderSection'
import { GroupSection } from './GroupSection'

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return closestCenter(args)
}

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)
    const type = active.data.current?.type

    if (type === 'folder') {
      if (activeId === overId) return
      let overFolderId = overId.startsWith('folder:')
        ? overId.slice('folder:'.length)
        : overId
      if (folders.every((f) => f.id !== overFolderId)) {
        const overInstance = instances.find((i) => i.id === overId)
        if (!overInstance?.folderId) return
        overFolderId = overInstance.folderId
      }
      if (activeId === overFolderId) return
      const ids = folders.map((f) => f.id)
      const fromIndex = ids.indexOf(activeId)
      const toIndex = ids.indexOf(overFolderId)
      if (fromIndex === -1 || toIndex === -1) return
      onReorderFolders(arrayMove(ids, fromIndex, toIndex))
      return
    }

    if (type !== 'instance') return
    const instance = instances.find((i) => i.id === activeId)
    if (!instance) return

    if (overId.startsWith('folder:')) {
      const folderId = overId.slice('folder:'.length)
      if (instance.folderId !== folderId) onMoveToFolder(activeId, folderId)
      return
    }

    if (overId === 'root') {
      if (instance.folderId !== null) onMoveToFolder(activeId, null)
      return
    }

    if (folders.some((f) => f.id === overId)) {
      const folder = folders.find((f) => f.id === overId)!
      if (instance.folderId !== folder.id) onMoveToFolder(activeId, folder.id)
      return
    }

    const overInstance = instances.find((i) => i.id === overId)
    if (!overInstance) return

    if (overInstance.folderId === instance.folderId) {
      const ids = instances
        .filter((i) => i.folderId === instance.folderId)
        .map((i) => i.id)
      const fromIndex = ids.indexOf(activeId)
      const toIndex = ids.indexOf(overId)
      if (fromIndex !== -1 && toIndex !== -1)
        onReorderInstances(arrayMove(ids, fromIndex, toIndex))
    } else {
      onMoveToFolder(activeId, overInstance.folderId)
    }
  }

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
