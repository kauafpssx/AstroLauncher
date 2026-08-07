export type ModSource = 'modrinth' | 'curseforge'
type ProjectType = 'mod' | 'modpack' | 'resourcepack' | 'shader'
/** Installable content kinds: excludes 'modpack', which creates a whole new instance instead. */
export type ContentKind = 'mod' | 'resourcepack' | 'shader'

export interface ModSearchResult {
  source: ModSource
  projectId: string
  name: string
  description: string
  iconUrl: string | null
  downloads: number
  author: string
  loader: string | null
  gameVersion: string | null
}

export interface ModVersion {
  id: string
  name: string
  fileName: string
  gameVersions: string[]
  downloadUrl: string | null
  requiredDependencyProjectIds: string[]
}

export interface ModProject {
  source: ModSource
  projectId: string
  name: string
  description: string
  body: string | null
  iconUrl: string | null
  downloads: number
  sourceUrl: string | null
  issuesUrl: string | null
  wikiUrl: string | null
  discordUrl: string | null
}

export interface InstalledMod {
  id: string
  modId: string
  source: string
  name: string
  version: string
  fileName: string
  iconUrl: string | null
  kind: ContentKind
  enabled: boolean
}

export type ModSortBy = 'relevance' | 'downloads' | 'newest' | 'updated'

export interface SearchModsInput {
  source: ModSource
  query: string
  projectType: ProjectType
  gameVersion?: string | null
  loader?: string | null
  sort?: ModSortBy | null
}

export interface GetModVersionsInput {
  source: ModSource
  projectId: string
  gameVersion?: string | null
  loader?: string | null
}

export interface InstallModInput {
  instanceId: string
  source: ModSource
  projectId: string
  modName: string
  versionName: string
  fileName: string
  downloadUrl: string
  iconUrl: string | null
  kind: ContentKind
}

export interface InstallModpackInput {
  instanceName: string
  downloadUrl: string
  iconUrl?: string | null
  folderId?: string | null
}

export interface InstallCustomModInput {
  instanceId: string
  filePath: string
  kind: ContentKind
}
