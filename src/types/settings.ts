export interface SettingsDTO {
  curseforgeApiKey: string | null
  mcstatApiKey: string | null
  rootGroupName: string | null
  rootGroupIcon: string | null
}

export interface UpdateSettingsInput {
  curseforgeApiKey?: string | null
  mcstatApiKey?: string | null
  rootGroupName?: string | null
  rootGroupIcon?: string | null
}
