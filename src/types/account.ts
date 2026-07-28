export interface AccountDTO {
  id: string
  username: string
  accountType: string
  uuid: string
  position: number
  isDefault: boolean
  lastUsed: string | null
  createdAt: string
}

export interface CreateAccountInput {
  username: string
}

export interface UpdateAccountInput {
  id: string
  username: string
}
