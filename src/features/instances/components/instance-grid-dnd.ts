import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import type { FolderDTO } from '@/types/folder'
import type { InstanceDTO } from '@/types/instance'

export const GRID_BACKGROUND_MENU_ID = 'instance-grid-background'

export const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) return pointerCollisions
  return closestCenter(args)
}

interface DragEndHandlers {
  folders: FolderDTO[]
  instances: InstanceDTO[]
  onMoveToFolder: (instanceId: string, folderId: string | null) => void
  onReorderFolders: (orderedIds: string[]) => void
  onReorderInstances: (orderedIds: string[]) => void
}

export function handleInstanceDragEnd(
  event: DragEndEvent,
  {
    folders,
    instances,
    onMoveToFolder,
    onReorderFolders,
    onReorderInstances,
  }: DragEndHandlers,
) {
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
