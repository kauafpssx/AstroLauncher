import { create } from 'zustand'

import { FolderAPI } from '@/features/instances/services/folder.api'
import type {
  CreateFolderInput,
  FolderDTO,
  UpdateFolderInput,
} from '@/types/folder'

interface FolderStore {
  folders: FolderDTO[]
  isLoading: boolean
  error: string | null

  fetchFolders: () => Promise<void>
  createFolder: (input: CreateFolderInput) => Promise<void>
  updateFolder: (input: UpdateFolderInput) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  reorderFolders: (orderedIds: string[]) => Promise<void>
  setCollapsed: (id: string, collapsed: boolean) => Promise<void>
}

export const useFolderStore = create<FolderStore>((set, get) => ({
  folders: [],
  isLoading: false,
  error: null,

  fetchFolders: async () => {
    set({ isLoading: true, error: null })
    try {
      const folders = await FolderAPI.list()
      set({ folders, isLoading: false })
    } catch (err) {
      set({ isLoading: false, error: String(err) })
    }
  },

  createFolder: async (input) => {
    const folder = await FolderAPI.create(input)
    set((state) => ({ folders: [...state.folders, folder] }))
  },

  updateFolder: async (input) => {
    const folder = await FolderAPI.update(input)
    set((state) => ({
      folders: state.folders.map((f) => (f.id === folder.id ? folder : f)),
    }))
  },

  deleteFolder: async (id) => {
    await FolderAPI.delete(id)
    set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }))
  },

  reorderFolders: async (orderedIds) => {
    const byId = new Map(get().folders.map((f) => [f.id, f]))
    const reordered = orderedIds.map((id) => byId.get(id)!).filter(Boolean)
    set({ folders: reordered })
    await FolderAPI.reorder(orderedIds)
  },

  setCollapsed: async (id, collapsed) => {
    const folder = get().folders.find((f) => f.id === id)
    if (!folder) return
    await FolderAPI.update({ id, name: folder.name, collapsed })
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, collapsed } : f,
      ),
    }))
  },
}))
