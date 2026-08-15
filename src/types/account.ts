export interface AccountDTO {
  id: string
  username: string
  accountType: string
  uuid: string
  position: number
  isDefault: boolean
  lastUsed: string | null
  createdAt: string
  iconPath: string | null
}

export interface CreateAccountInput {
  username: string
  iconPath?: string | null
}

export interface UpdateAccountInput {
  id: string
  username: string
  iconPath?: string | null
}
