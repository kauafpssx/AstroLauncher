import { apiInvoke } from '@/lib/api/client'
import type { SearchSkinsInput, SkinDetail, SkinSummary } from '@/types/skins'

export const SkinAPI = {
  search(input: SearchSkinsInput): Promise<SkinSummary[]> {
    return apiInvoke<SkinSummary[]>('search_skins', { input })
  },
  getSkin(hash: string): Promise<SkinDetail> {
    return apiInvoke<SkinDetail>('get_skin', { hash })
  },
  downloadSkin(skinUrl: string, destPath: string): Promise<void> {
    return apiInvoke<void>('download_skin', { skinUrl, destPath })
  },
}
