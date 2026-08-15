import { apiInvoke } from '@/lib/api/client'
import type {
  CentralMemberDTO,
  CentralNetworkSummaryDTO,
  LocalNetworkDTO,
  ZeroTierStatusDTO,
} from '@/types/zerotier'

export const ZeroTierAPI = {
  status(): Promise<ZeroTierStatusDTO> {
    return apiInvoke<ZeroTierStatusDTO>('zerotier_status')
  },
  install(): Promise<void> {
    return apiInvoke<void>('zerotier_install')
  },
  join(networkId: string): Promise<void> {
    return apiInvoke<void>('zerotier_join', { networkId })
  },
  leave(networkId: string): Promise<void> {
    return apiInvoke<void>('zerotier_leave', { networkId })
  },
  listNetworks(): Promise<LocalNetworkDTO[]> {
    return apiInvoke<LocalNetworkDTO[]>('zerotier_list_networks')
  },
  listOwnedNetworks(): Promise<CentralNetworkSummaryDTO[]> {
    return apiInvoke<CentralNetworkSummaryDTO[]>('zerotier_list_owned_networks')
  },
  listPendingMembers(networkId: string): Promise<CentralMemberDTO[]> {
    return apiInvoke<CentralMemberDTO[]>('zerotier_list_pending_members', {
      networkId,
    })
  },
  approveMember(networkId: string, nodeId: string): Promise<void> {
    return apiInvoke<void>('zerotier_approve_member', { networkId, nodeId })
  },
  deauthorizeMember(networkId: string, nodeId: string): Promise<void> {
    return apiInvoke<void>('zerotier_deauthorize_member', {
      networkId,
      nodeId,
    })
  },
}
