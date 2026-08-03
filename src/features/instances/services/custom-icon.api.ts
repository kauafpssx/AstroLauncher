import { apiInvoke } from '@/lib/api/client'

export interface CustomIconDTO {
  id: string
  path: string
}

export const CustomIconAPI = {
  list(): Promise<CustomIconDTO[]> {
    return apiInvoke<CustomIconDTO[]>('list_custom_icons')
  },
  save(base64Png: string): Promise<CustomIconDTO> {
    return apiInvoke<CustomIconDTO>('save_custom_icon', { base64Png })
  },
  delete(id: string): Promise<void> {
    return apiInvoke<void>('delete_custom_icon', { id })
  },
}
