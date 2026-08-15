import { apiInvoke } from '@/lib/api/client'
import type { ConfigFileDTO } from '@/types/config-file'
import type { NoteDTO } from '@/types/note'
import type { ScreenshotDTO } from '@/types/screenshot'
import type { ServerEntryDTO } from '@/types/server'
import type { WorldDTO } from '@/types/world'

export const InstanceWorkspaceAPI = {
  readLog(id: string): Promise<string> {
    return apiInvoke<string>('read_instance_log', { id })
  },
  listNotes(id: string): Promise<NoteDTO[]> {
    return apiInvoke<NoteDTO[]>('list_instance_notes', { id })
  },
  readNote(id: string, noteId: string): Promise<string> {
    return apiInvoke<string>('read_instance_note', { id, noteId })
  },
  writeNote(id: string, noteId: string, content: string): Promise<void> {
    return apiInvoke<void>('write_instance_note', { id, noteId, content })
  },
  createNote(id: string, title: string): Promise<NoteDTO> {
    return apiInvoke<NoteDTO>('create_instance_note', { id, title })
  },
  renameNote(id: string, noteId: string, newTitle: string): Promise<NoteDTO> {
    return apiInvoke<NoteDTO>('rename_instance_note', { id, noteId, newTitle })
  },
  deleteNote(id: string, noteId: string): Promise<void> {
    return apiInvoke<void>('delete_instance_note', { id, noteId })
  },
  listConfigFiles(id: string): Promise<ConfigFileDTO[]> {
    return apiInvoke<ConfigFileDTO[]>('list_instance_config_files', { id })
  },
  readConfigFile(id: string, path: string): Promise<string> {
    return apiInvoke<string>('read_instance_config_file', { id, path })
  },
  writeConfigFile(id: string, path: string, content: string): Promise<void> {
    return apiInvoke<void>('write_instance_config_file', { id, path, content })
  },
  openFolder(id: string): Promise<void> {
    return apiInvoke<void>('open_instance_folder', { id })
  },
  getDiskUsage(id: string): Promise<number> {
    return apiInvoke<number>('get_instance_disk_usage', { id })
  },
  listShortcuts(): Promise<string[]> {
    return apiInvoke<string[]>('list_instance_shortcuts')
  },
  toggleShortcut(id: string, iconPngBase64: string | null): Promise<boolean> {
    return apiInvoke<boolean>('toggle_instance_shortcut', {
      id,
      iconPngBase64,
    })
  },
  refreshShortcutIcon(id: string, iconPngBase64: string | null): Promise<void> {
    return apiInvoke<void>('refresh_instance_shortcut_icon', {
      id,
      iconPngBase64,
    })
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
  updateServer(
    id: string,
    index: number,
    name: string,
    ip: string,
  ): Promise<void> {
    return apiInvoke<void>('update_instance_server', {
      id,
      index,
      input: { name, ip },
    })
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
  readScreenshotThumbnail(id: string, name: string): Promise<string> {
    return apiInvoke<string>('read_instance_screenshot_thumbnail', {
      id,
      name,
    })
  },
  deleteScreenshot(id: string, name: string): Promise<void> {
    return apiInvoke<void>('delete_instance_screenshot', { id, name })
  },
  saveScreenshotAs(id: string, name: string, destPath: string): Promise<void> {
    return apiInvoke<void>('save_instance_screenshot_as', {
      id,
      name,
      destPath,
    })
  },
  renameScreenshot(id: string, name: string, newName: string): Promise<string> {
    return apiInvoke<string>('rename_instance_screenshot', {
      id,
      name,
      newName,
    })
  },
}
