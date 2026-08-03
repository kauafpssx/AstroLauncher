import type { ContentKind } from '@/types/mods'

export const CONTENT_KIND_ORDER: ContentKind[] = [
  'mod',
  'resourcepack',
  'shader',
]

export const CONTENT_KIND_LABELS: Record<
  ContentKind,
  { plural: string; fileFilter: string }
> = {
  mod: { plural: 'Mods', fileFilter: 'jar' },
  resourcepack: { plural: 'Resource Packs', fileFilter: 'zip' },
  shader: { plural: 'Shader Packs', fileFilter: 'zip' },
}

export function groupByContentKind<T extends { kind: string }>(items: T[]) {
  return CONTENT_KIND_ORDER.map((kind) => ({
    kind,
    label: CONTENT_KIND_LABELS[kind].plural,
    items: items.filter((item) => item.kind === kind),
  })).filter((group) => group.items.length > 0)
}
