import type { ModSortBy, ModSource } from '@/types/mods'

export const SOURCES: { id: ModSource; label: string; logo: string }[] = [
  { id: 'modrinth', label: 'Modrinth', logo: '/providers/modrinth.svg' },
  { id: 'curseforge', label: 'CurseForge', logo: '/providers/curseforge.png' },
]

export const SORT_OPTIONS: { value: ModSortBy; label: string }[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'updated', label: 'Atualizados' },
]
