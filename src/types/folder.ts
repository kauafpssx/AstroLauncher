export interface FolderDTO {
  id: string
  name: string
  position: number
  collapsed: boolean
  iconPath: string | null
}

export interface CreateFolderInput {
  name: string
}

export interface UpdateFolderInput {
  id: string
  name: string
  collapsed: boolean
  iconPath?: string | null
}
