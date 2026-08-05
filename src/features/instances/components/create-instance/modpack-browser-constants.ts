import type { ModSortBy, ModSource } from '@/types/mods'

export const SOURCE_LABEL: Record<ModSource, string> = {
  modrinth: 'Modrinth',
  curseforge: 'CurseForge',
}

export const SOURCE_LOGO: Record<ModSource, string> = {
  modrinth: '/providers/modrinth.svg',
  curseforge: '/providers/curseforge.png',
}

export const LOADER_ICON: Record<string, string> = {
  fabric: '/providers/fabricmc.svg',
  quilt: '/providers/quiltmc.svg',
  forge: '/providers/forge.png',
  neoforge: '/providers/neoforged.svg',
}

export const LOADER_LABEL: Record<string, string> = {
  fabric: 'Fabric',
  quilt: 'Quilt',
  forge: 'Forge',
  neoforge: 'NeoForge',
}

export const SORT_OPTIONS: { value: ModSortBy; label: string }[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'updated', label: 'Atualizados' },
]
