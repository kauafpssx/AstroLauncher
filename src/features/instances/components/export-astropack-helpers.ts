import type { AstroPackCategoryItem } from './AstroPackCategoryList'
import type { ExportSelection, ExportSummary } from '../services/astropack.api'

export async function iconToDataUri(src: string): Promise<string | null> {
  try {
    const response = await fetch(src)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Falha ao ler ícone'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function buildExportCategoryItems(
  summary: ExportSummary | null,
  selection: ExportSelection,
): AstroPackCategoryItem[] {
  return summary
    ? [
        {
          key: 'settings',
          label: 'Configurações do jogo (options.txt)',
          count: summary.hasSettings,
          checked: selection.settings,
        },
        {
          key: 'worlds',
          label: 'Mundos',
          count: summary.worlds,
          checked: selection.worlds,
        },
        {
          key: 'notes',
          label: 'Notas',
          count: summary.hasNotes,
          checked: selection.notes,
        },
        {
          key: 'mods',
          label: 'Mods',
          count: summary.mods,
          checked: selection.mods,
        },
        {
          key: 'resourcepacks',
          label: 'Resource Packs',
          count: summary.resourcepacks,
          checked: selection.resourcepacks,
        },
        {
          key: 'shaders',
          label: 'Shader Packs',
          count: summary.shaders,
          checked: selection.shaders,
        },
        {
          key: 'servers',
          label: 'Servidores salvos',
          count: summary.servers,
          checked: selection.servers,
        },
        {
          key: 'screenshots',
          label: 'Screenshots',
          count: summary.screenshots,
          checked: selection.screenshots,
        },
      ]
    : []
}
