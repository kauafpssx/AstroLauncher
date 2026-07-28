import { apiInvoke } from '@/lib/api/client'
import type { ScreenshotDTO } from '@/types/screenshot'
import type { ServerEntryDTO } from '@/types/server'
import type { WorldDTO } from '@/types/world'

export const InstanceWorkspaceAPI = {
  readLog(id: string): Promise<string> {
    return apiInvoke<string>('read_instance_log', { id })
  },
  readNotes(id: string): Promise<string> {
    return apiInvoke<string>('read_instance_notes', { id })
  },
  writeNotes(id: string, content: string): Promise<void> {
    return apiInvoke<void>('write_instance_notes', { id, content })
  },
  openFolder(id: string): Promise<void> {
    return apiInvoke<void>('open_instance_folder', { id })
  },
  listWorlds(id: string): Promise<WorldDTO[]> {
    return apiInvoke<WorldDTO[]>('list_instance_worlds', { id })
  },
  deleteWorld(id: string, worldName: string): Promise<void> {
    return apiInvoke<void>('delete_instance_world', { id, worldName })
  },
  listServers(id: string): Promise<ServerEntryDTO[]> {
    return apiInvoke<ServerEntryDTO[]>('list_instance_servers', { id })
  },
  addServer(id: string, name: string, ip: string): Promise<void> {
    return apiInvoke<void>('add_instance_server', { id, input: { name, ip } })
  },
  updateServer(id: string, index: number, name: string, ip: string): Promise<void> {
    return apiInvoke<void>('update_instance_server', { id, index, input: { name, ip } })
  },
  deleteServer(id: string, index: number): Promise<void> {
    return apiInvoke<void>('delete_instance_server', { id, index })
  },
  listScreenshots(id: string): Promise<ScreenshotDTO[]> {
    return apiInvoke<ScreenshotDTO[]>('list_instance_screenshots', { id })
  },
  readScreenshot(id: string, name: string): Promise<string> {
    return apiInvoke<string>('read_instance_screenshot', { id, name })
  },
  deleteScreenshot(id: string, name: string): Promise<void> {
    return apiInvoke<void>('delete_instance_screenshot', { id, name })
  },
  saveScreenshotAs(id: string, name: string, destPath: string): Promise<void> {
    return apiInvoke<void>('save_instance_screenshot_as', { id, name, destPath })
  },
  renameScreenshot(id: string, name: string, newName: string): Promise<string> {
    return apiInvoke<string>('rename_instance_screenshot', { id, name, newName })
  },
}
