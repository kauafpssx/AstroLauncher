import { STRUCTURE_BY_ID } from '@/features/instances/components/edit-instance/seed-map/components/seed-map-shared'
export const SLIME_CHUNK_POPUP_ID = 'slime-chunk'
const SLIME_CHUNK_POPUP_META = {
  labelPt: 'Slime Chunk',
  iconPath: '/seed-map/icons-128/slime-chunk.png',
  basePath: '/seed-map/bases/slime-chunk-base.png',
}
export function getStructurePopupMeta(id: string) {
  return id === SLIME_CHUNK_POPUP_ID
    ? SLIME_CHUNK_POPUP_META
    : STRUCTURE_BY_ID.get(id)
}
