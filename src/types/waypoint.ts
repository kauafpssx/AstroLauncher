export interface WaypointDTO {
  id: string
  instanceId: string
  name: string
  icon: string
  dimension: 'overworld' | 'nether' | 'end'
  x: number
  y: number | null
  z: number
  createdAt: string
}
export interface CreateWaypointInput {
  instanceId: string
  name: string
  icon: string
  dimension: 'overworld' | 'nether' | 'end'
  x: number
  y: number | null
  z: number
}
export interface UpdateWaypointInput {
  name: string
  icon: string
  dimension: 'overworld' | 'nether' | 'end'
  x: number
  y: number | null
  z: number
}
