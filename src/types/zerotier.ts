export type LocalNetworkStatus =
  | 'REQUESTING_CONFIGURATION'
  | 'OK'
  | 'ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'PORT_ERROR'
  | 'CLIENT_TOO_OLD'
  | 'AUTHENTICATION_REQUIRED'

interface NodeInfoDTO {
  address: string
  online: boolean
  version: string
}

export interface LocalNetworkDTO {
  id: string
  name: string
  status: LocalNetworkStatus
  assignedAddresses: string[]
  dhcp: boolean
}

export interface ZeroTierStatusDTO {
  installed: boolean
  node: NodeInfoDTO | null
  networks: LocalNetworkDTO[]
}

export interface CentralNetworkSummaryDTO {
  id: string
  name: string
}

export interface CentralMemberDTO {
  nodeId: string
  name: string | null
  authorized: boolean
  ipAssignments: string[]
}
