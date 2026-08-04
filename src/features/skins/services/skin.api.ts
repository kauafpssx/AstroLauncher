import { apiInvoke } from '@/lib/api/client'
import type {
  SearchSkinsInput,
  SkinDetail,
  SkinSource,
  SkinSummary,
} from '@/types/skins'

export const SkinAPI = {
  search(input: SearchSkinsInput): Promise<SkinSummary[]> {
    return apiInvoke<SkinSummary[]>('search_skins', { input })
  },
  getSkin(source: SkinSource, id: string): Promise<SkinDetail> {
    return apiInvoke<SkinDetail>('get_skin', { source, id })
  },
  downloadSkin(skinUrl: string, destPath: string): Promise<void> {
    return apiInvoke<void>('download_skin', { skinUrl, destPath })
  },
  fetchTextureBase64(url: string): Promise<string> {
    return apiInvoke<string>('fetch_skin_texture_base64', { url })
  },
}
