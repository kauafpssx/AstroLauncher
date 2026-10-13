import type { ContentKind } from '@/types/mods'
export const SOURCE_LOGO: Record<string, string> = {
  modrinth: '/providers/modrinth.svg',
  curseforge: '/providers/curseforge.png',
}
export const LABELS: Record<
  ContentKind,
  {
    title: (count: number) => string
    addLabel: string
    emptyLabel: string
    pluralLabel: string
  }
> = {
  mod: {
    title: (count) =>
      `${count} ${count === 1 ? 'Mod instalado' : 'Mods instalados'} nesta instância.`,
    addLabel: 'Adicionar Mod',
    emptyLabel: 'Nenhum mod instalado.',
    pluralLabel: 'mods',
  },
  resourcepack: {
    title: (count) =>
      `${count} ${count === 1 ? 'Resource pack instalado' : 'Resource packs instalados'} nesta instância.`,
    addLabel: 'Adicionar Resource Pack',
    emptyLabel: 'Nenhum resource pack instalado.',
    pluralLabel: 'resource packs',
  },
  shader: {
    title: (count) =>
      `${count} ${count === 1 ? 'Shader pack instalado' : 'Shader packs instalados'} nesta instância.`,
    addLabel: 'Adicionar Shader Pack',
    emptyLabel: 'Nenhum shader pack instalado.',
    pluralLabel: 'shader packs',
  },
}
