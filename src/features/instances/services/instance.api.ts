import { apiInvoke } from '@/lib/api/client'
import type {
  CreateInstanceInput,
  InstanceDTO,
  UpdateInstanceInput,
} from '@/types/instance'

export const InstanceAPI = {
  list(): Promise<InstanceDTO[]> {
    return apiInvoke<InstanceDTO[]>('list_instances')
  },
  create(input: CreateInstanceInput): Promise<InstanceDTO> {
    return apiInvoke<InstanceDTO>('create_instance', { input })
  },
  update(input: UpdateInstanceInput): Promise<InstanceDTO> {
    return apiInvoke<InstanceDTO>('update_instance', { input })
  },
  delete(id: string): Promise<void> {
    return apiInvoke<void>('delete_instance', { id })
  },
  duplicate(id: string): Promise<InstanceDTO> {
    return apiInvoke<InstanceDTO>('duplicate_instance', { id })
  },
  moveToFolder(id: string, folderId: string | null): Promise<InstanceDTO> {
    return apiInvoke<InstanceDTO>('move_instance_to_folder', { id, folderId })
  },
  reorder(orderedIds: string[]): Promise<void> {
    return apiInvoke<void>('reorder_instances', { orderedIds })
  },
  getTotalSystemMemoryMb(): Promise<number> {
    return apiInvoke<number>('get_total_system_memory_mb')
  },
  listAudioOutputDevices(): Promise<string[]> {
    return apiInvoke<string[]>('list_audio_output_devices')
  },
}
