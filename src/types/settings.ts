export interface SettingsDTO {
  curseforgeApiKey: string | null
  mcstatApiKey: string | null
  rootGroupName: string | null
  rootGroupIcon: string | null
  zerotierApiToken: string | null
  autoUpdateEnabled: boolean
}
export interface UpdateSettingsInput {
  curseforgeApiKey?: string | null
  mcstatApiKey?: string | null
  rootGroupName?: string | null
  rootGroupIcon?: string | null
  zerotierApiToken?: string | null
  autoUpdateEnabled?: boolean | null
}
