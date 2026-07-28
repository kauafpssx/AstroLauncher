import { apiInvoke } from '@/lib/api/client'
import type { CreateInstanceInput, InstanceDTO, UpdateInstanceInput } from '@/types/instance'

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
}
