import type { AstroPackCategoryItem } from './AstroPackCategoryList'
import type {
  AstroPackManifest,
  ExportSelection,
} from '../services/astropack.api'

export type EntryStatus = 'pending' | 'downloading' | 'done' | 'failed'

export interface EntryProgress {
  kind: string
  name: string
  iconUrl: string | null
  status: EntryStatus
}

export type Step = 'loading' | 'preview' | 'importing' | 'failed-preview'

export function computeImportEntries(
  manifest: AstroPackManifest,
  selection: ExportSelection,
): { entries: EntryProgress[]; total: number } {
  const selectedContents = manifest.contents.filter((entry) => {
    if (entry.kind === 'resourcepack') return selection.resourcepacks
    if (entry.kind === 'shader') return selection.shaders
    return selection.mods
  })
  return {
    entries: selectedContents.map((entry) => ({
      kind: entry.kind,
      name: entry.name,
      iconUrl: entry.iconUrl,
      status: 'pending' as EntryStatus,
    })),
    total:
      selectedContents.length +
      (selection.worlds ? manifest.worlds.length : 0) +
      (selection.screenshots ? manifest.screenshots.length : 0),
  }
}

export function buildImportCategoryItems(
  manifest: AstroPackManifest | null,
  selection: ExportSelection,
): AstroPackCategoryItem[] {
  return manifest
    ? [
        {
          key: 'settings',
          label: 'Configurações do jogo (options.txt)',
          count: !!manifest.settings,
          checked: selection.settings,
        },
        {
          key: 'worlds',
          label: 'Mundos',
          count: manifest.worlds.length,
          checked: selection.worlds,
        },
        {
          key: 'notes',
          label: 'Notas',
          count: manifest.notes.length,
          checked: selection.notes,
        },
        {
          key: 'mods',
          label: 'Mods',
          count: manifest.contents.filter((e) => e.kind === 'mod').length,
          checked: selection.mods,
        },
        {
          key: 'resourcepacks',
          label: 'Resource Packs',
          count: manifest.contents.filter((e) => e.kind === 'resourcepack')
            .length,
          checked: selection.resourcepacks,
        },
        {
          key: 'shaders',
          label: 'Shader Packs',
          count: manifest.contents.filter((e) => e.kind === 'shader').length,
          checked: selection.shaders,
        },
        {
          key: 'servers',
          label: 'Servidores salvos',
          count: manifest.servers.length,
          checked: selection.servers,
        },
        {
          key: 'screenshots',
          label: 'Screenshots',
          count: manifest.screenshots.length,
          checked: selection.screenshots,
        },
      ]
    : []
}
