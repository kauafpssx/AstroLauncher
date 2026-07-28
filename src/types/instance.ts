export interface InstanceDTO {
  id: string
  name: string
  version: string
  loader: string | null
  loaderVersion: string | null
  iconPath: string | null
  folderId: string | null
  javaArgs: string | null
  minMemory: number
  maxMemory: number
  createdAt: string
  lastPlayed: string | null
  playtimeSeconds: number
}

export interface CreateInstanceInput {
  name: string
  version: string
  loader?: string | null
  loaderVersion?: string | null
  folderId?: string | null
}

export interface UpdateInstanceInput {
  id: string
  name: string
  version: string
  loader: string | null
  loaderVersion: string | null
  javaArgs: string | null
  minMemory: number
  maxMemory: number
}
