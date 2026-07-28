import { apiInvoke } from '@/lib/api/client'
import type { InstanceDTO } from '@/types/instance'

export interface AstroPackContentEntry {
  kind: string
  source: string
  projectId: string
  name: string
  versionName: string
  fileName: string
  downloadUrl: string | null
  iconUrl: string | null
}

export interface AstroPackServerEntry {
  name: string
  ip: string
}

export interface AstroPackManifest {
  schemaVersion: number
  name: string
  version: string
  loader: string | null
  loaderVersion: string | null
  javaArgs: string | null
  minMemory: number
  maxMemory: number
  contents: AstroPackContentEntry[]
  settings: string | null
  notes: string | null
  worlds: string[]
  servers: AstroPackServerEntry[]
  screenshots: string[]
}

export interface ExportSelection {
  settings: boolean
  worlds: boolean
  notes: boolean
  mods: boolean
  resourcepacks: boolean
  shaders: boolean
  servers: boolean
  screenshots: boolean
}

export interface ExportSummary {
  mods: number
  resourcepacks: number
  shaders: number
  worlds: number
  hasNotes: boolean
  hasSettings: boolean
  servers: number
  screenshots: number
}

export const ALL_SELECTED: ExportSelection = {
  settings: true,
  worlds: true,
  notes: true,
  mods: true,
  resourcepacks: true,
  shaders: true,
  servers: true,
  screenshots: true,
}

export interface ExportResult {
  filePath: string
}

export interface ImportAstroPackInput {
  filePath: string
  selection: ExportSelection
}

export type AstroPackEvent =
  | { type: 'progress'; kind: string; name: string; current: number; total: number }
  | { type: 'done'; instanceId: string }
  | { type: 'error'; message: string }

export const AstroPackAPI = {
  getExportSummary(instanceId: string): Promise<ExportSummary> {
    return apiInvoke<ExportSummary>('get_astropack_export_summary', { instanceId })
  },
  exportInstance(instanceId: string, destPath: string, selection: ExportSelection): Promise<ExportResult> {
    return apiInvoke<ExportResult>('export_instance', { instanceId, destPath, selection })
  },
  previewAstropack(filePath: string): Promise<AstroPackManifest> {
    return apiInvoke<AstroPackManifest>('preview_astropack', { filePath })
  },
  importAstropack(input: ImportAstroPackInput): Promise<InstanceDTO> {
    return apiInvoke<InstanceDTO>('import_astropack', { input })
  },
}
