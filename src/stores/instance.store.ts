import { listen } from '@tauri-apps/api/event'
import { create } from 'zustand'

import { InstanceAPI } from '@/features/instances/services/instance.api'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { resolvePickerIconPngBase64 } from '@/lib/icon-src'
import type {
  CreateInstanceInput,
  InstanceDTO,
  UpdateInstanceInput,
} from '@/types/instance'

interface InstanceStore {
  instances: InstanceDTO[]
  selectedInstanceId: string | null
  shortcutIds: string[]
  isLoading: boolean
  error: string | null

  fetchInstances: () => Promise<void>
  fetchShortcuts: () => Promise<void>
  toggleShortcut: (id: string, iconPngBase64: string | null) => Promise<boolean>
  createInstance: (input: CreateInstanceInput) => Promise<void>
  duplicateInstance: (id: string) => Promise<void>
  updateInstance: (input: UpdateInstanceInput) => Promise<InstanceDTO>
  deleteInstance: (id: string) => Promise<void>
  moveInstance: (id: string, folderId: string | null) => Promise<void>
  reorderInstances: (orderedIds: string[]) => Promise<void>
  selectInstance: (id: string | null) => void
}

export const useInstanceStore = create<InstanceStore>((set, get) => ({
  instances: [],
  selectedInstanceId: null,
  shortcutIds: [],
  isLoading: false,
  error: null,

  fetchInstances: async () => {
    set({ isLoading: true, error: null })
    try {
      const instances = await InstanceAPI.list()
      set((state) => ({
        instances,
        isLoading: false,
        selectedInstanceId:
          state.selectedInstanceId ?? instances[0]?.id ?? null,
      }))
    } catch (err) {
      set({ isLoading: false, error: String(err) })
    }
  },

  fetchShortcuts: async () => {
    try {
      const shortcutIds = await InstanceWorkspaceAPI.listShortcuts()
      set({ shortcutIds })
    } catch {
      // Shortcut state is a convenience, not worth a full-page error.
    }
  },

  toggleShortcut: async (id, iconPngBase64) => {
    const enabled = await InstanceWorkspaceAPI.toggleShortcut(id, iconPngBase64)
    set((state) => ({
      shortcutIds: enabled
        ? [...state.shortcutIds, id]
        : state.shortcutIds.filter((shortcutId) => shortcutId !== id),
    }))
    return enabled
  },

  createInstance: async (input) => {
    const instance = await InstanceAPI.create(input)
    set((state) => ({
      instances: [...state.instances, instance],
      selectedInstanceId: instance.id,
    }))
  },

  duplicateInstance: async (id) => {
    const instance = await InstanceAPI.duplicate(id)
    set((state) => ({
      instances: [...state.instances, instance],
      selectedInstanceId: instance.id,
    }))
  },

  updateInstance: async (input) => {
    const instance = await InstanceAPI.update(input)
    set((state) => ({
      instances: state.instances.map((i) =>
        i.id === instance.id ? instance : i,
      ),
    }))
    // Keep an existing desktop shortcut's icon in sync with the instance's.
    if (get().shortcutIds.includes(instance.id)) {
      resolvePickerIconPngBase64(instance.iconPath)
        .then((iconPngBase64) =>
          InstanceWorkspaceAPI.refreshShortcutIcon(instance.id, iconPngBase64),
        )
        .catch(() => {})
    }
    return instance
  },

  deleteInstance: async (id) => {
    await InstanceAPI.delete(id)
    set((state) => {
      const instances = state.instances.filter((i) => i.id !== id)
      const selectedInstanceId =
        state.selectedInstanceId === id
          ? (instances[0]?.id ?? null)
          : state.selectedInstanceId
      return { instances, selectedInstanceId }
    })
  },

  moveInstance: async (id, folderId) => {
    const instance = await InstanceAPI.moveToFolder(id, folderId)
    set((state) => ({
      instances: state.instances.map((i) =>
        i.id === instance.id ? instance : i,
      ),
    }))
  },

  reorderInstances: async (orderedIds) => {
    const byId = new Map(get().instances.map((i) => [i.id, i]))
    const reordered = orderedIds.map((id) => byId.get(id)!).filter(Boolean)
    set({ instances: reordered })
    await InstanceAPI.reorder(orderedIds)
  },

  selectInstance: (id) => set({ selectedInstanceId: id }),
}))

export function useSelectedInstance(): InstanceDTO | null {
  return useInstanceStore(
    (state) =>
      state.instances.find((i) => i.id === state.selectedInstanceId) ?? null,
  )
}

// Reload instances when a game exits so denormalized playtime totals and the
// last-played timestamp are reflected right away (see stores/launch.store.ts).
listen<string>('instance://stopped', () => {
  void useInstanceStore.getState().fetchInstances()
})
