import { apiInvoke } from '@/lib/api/client'
import type { SettingsDTO, UpdateSettingsInput } from '@/types/settings'

export const SettingsAPI = {
  get(): Promise<SettingsDTO> {
    return apiInvoke<SettingsDTO>('get_settings')
  },
  update(input: UpdateSettingsInput): Promise<SettingsDTO> {
    return apiInvoke<SettingsDTO>('update_settings', { input })
  },
}
