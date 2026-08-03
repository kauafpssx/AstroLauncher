export interface SettingsDTO {
  curseforgeApiKey: string | null
  rootGroupName: string | null
  rootGroupIcon: string | null
}

export interface UpdateSettingsInput {
  curseforgeApiKey?: string | null
  rootGroupName?: string | null
  rootGroupIcon?: string | null
}
