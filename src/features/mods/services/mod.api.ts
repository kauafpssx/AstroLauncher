import { apiInvoke } from '@/lib/api/client'
import type { InstanceDTO } from '@/types/instance'
import type {
  ContentKind,
  GetModVersionsInput,
  InstallCustomModInput,
  InstallModInput,
  InstallModpackInput,
  InstalledMod,
  ModProject,
  ModSearchResult,
  ModSource,
  ModVersion,
  SearchModsInput,
} from '@/types/mods'

export const ModAPI = {
  search(input: SearchModsInput): Promise<ModSearchResult[]> {
    return apiInvoke<ModSearchResult[]>('search_mods', { input })
  },
  getVersions(input: GetModVersionsInput): Promise<ModVersion[]> {
    return apiInvoke<ModVersion[]>('get_mod_versions', { input })
  },
  getProject(source: ModSource, projectId: string): Promise<ModProject> {
    return apiInvoke<ModProject>('get_mod_project', { input: { source, projectId } })
  },
  install(input: InstallModInput): Promise<InstalledMod> {
    return apiInvoke<InstalledMod>('install_mod', { input })
  },
  installCustom(input: InstallCustomModInput): Promise<InstalledMod> {
    return apiInvoke<InstalledMod>('install_custom_mod', { input })
  },
  listInstalled(instanceId: string, kind: ContentKind): Promise<InstalledMod[]> {
    return apiInvoke<InstalledMod[]>('list_instance_mods', { instanceId, kind })
  },
  setEnabled(instanceId: string, id: string, enabled: boolean): Promise<void> {
    return apiInvoke<void>('set_instance_mod_enabled', { instanceId, id, enabled })
  },
  deleteInstalled(instanceId: string, id: string): Promise<void> {
    return apiInvoke<void>('delete_instance_mod', { instanceId, id })
  },
  installModpack(source: ModSource, input: InstallModpackInput): Promise<InstanceDTO> {
    const command = source === 'curseforge' ? 'install_curseforge_modpack' : 'install_modrinth_modpack'
    return apiInvoke<InstanceDTO>(command, { input })
  },
  cancelModpackInstall(): Promise<void> {
    return apiInvoke<void>('cancel_modpack_install')
  },
}
