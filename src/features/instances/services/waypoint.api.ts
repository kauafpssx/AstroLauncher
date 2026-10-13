import { apiInvoke } from '@/lib/api/client'
import type {
  CreateWaypointInput,
  UpdateWaypointInput,
  WaypointDTO,
} from '@/types/waypoint'
export const WaypointAPI = {
  list(instanceId: string): Promise<WaypointDTO[]> {
    return apiInvoke<WaypointDTO[]>('list_waypoints', { instanceId })
  },
  create(input: CreateWaypointInput): Promise<WaypointDTO> {
    return apiInvoke<WaypointDTO>('create_waypoint', { input })
  },
  update(id: string, input: UpdateWaypointInput): Promise<WaypointDTO> {
    return apiInvoke<WaypointDTO>('update_waypoint', { id, input })
  },
  delete(id: string): Promise<void> {
    return apiInvoke<void>('delete_waypoint', { id })
  },
}
