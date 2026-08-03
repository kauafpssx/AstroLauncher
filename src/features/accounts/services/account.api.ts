import { apiInvoke } from '@/lib/api/client'
import type {
  AccountDTO,
  CreateAccountInput,
  UpdateAccountInput,
} from '@/types/account'

export const AccountAPI = {
  list(): Promise<AccountDTO[]> {
    return apiInvoke<AccountDTO[]>('list_accounts')
  },
  create(input: CreateAccountInput): Promise<AccountDTO> {
    return apiInvoke<AccountDTO>('create_account', { input })
  },
  update(input: UpdateAccountInput): Promise<AccountDTO> {
    return apiInvoke<AccountDTO>('update_account', { input })
  },
  delete(id: string): Promise<void> {
    return apiInvoke<void>('delete_account', { id })
  },
  setDefault(id: string): Promise<void> {
    return apiInvoke<void>('set_default_account', { id })
  },
  reorder(orderedIds: string[]): Promise<void> {
    return apiInvoke<void>('reorder_accounts', { orderedIds })
  },
}
