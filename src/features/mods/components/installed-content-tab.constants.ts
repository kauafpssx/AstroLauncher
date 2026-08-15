import type { ContentKind } from '@/types/mods'

export const SOURCE_LOGO: Record<string, string> = {
  modrinth: '/providers/modrinth.svg',
  curseforge: '/providers/curseforge.png',
}

export const LABELS: Record<
  ContentKind,
  {
    title: string
    addLabel: string
    emptyLabel: string
    /** Plural noun for the content kind, used in batch-action labels. */
    pluralLabel: string
  }
> = {
  mod: {
    title: 'Mods instalados nesta instância.',
    addLabel: 'Adicionar Mod',
    emptyLabel: 'Nenhum mod instalado.',
    pluralLabel: 'mods',
  },
  resourcepack: {
    title: 'Resource packs instalados nesta instância.',
    addLabel: 'Adicionar Resource Pack',
    emptyLabel: 'Nenhum resource pack instalado.',
    pluralLabel: 'resource packs',
  },
  shader: {
    title: 'Shader packs instalados nesta instância.',
    addLabel: 'Adicionar Shader Pack',
    emptyLabel: 'Nenhum shader pack instalado.',
    pluralLabel: 'shader packs',
  },
}
