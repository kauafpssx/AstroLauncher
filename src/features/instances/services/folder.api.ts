import { apiInvoke } from '@/lib/api/client'
import type {
  CreateFolderInput,
  FolderDTO,
  UpdateFolderInput,
} from '@/types/folder'

export const FolderAPI = {
  list(): Promise<FolderDTO[]> {
    return apiInvoke<FolderDTO[]>('list_folders')
  },
  create(input: CreateFolderInput): Promise<FolderDTO> {
    return apiInvoke<FolderDTO>('create_folder', { input })
  },
  update(input: UpdateFolderInput): Promise<FolderDTO> {
    return apiInvoke<FolderDTO>('update_folder', { input })
  },
  delete(id: string): Promise<void> {
    return apiInvoke<void>('delete_folder', { id })
  },
  reorder(orderedIds: string[]): Promise<void> {
    return apiInvoke<void>('reorder_folders', { orderedIds })
  },
}
