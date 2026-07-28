import { apiInvoke } from '@/lib/api/client'
import type { VersionDTO } from '@/types/version'

export const VersionAPI = {
  list(): Promise<VersionDTO[]> {
    return apiInvoke<VersionDTO[]>('list_minecraft_versions')
  },
}
