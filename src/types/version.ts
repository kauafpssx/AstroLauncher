export type VersionType = 'release' | 'snapshot' | 'old_beta' | 'old_alpha'

export interface VersionDTO {
  id: string
  type: VersionType
  releaseTime: string
}
