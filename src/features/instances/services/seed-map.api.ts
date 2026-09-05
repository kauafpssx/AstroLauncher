import { apiInvoke } from '@/lib/api/client'
import type {
  BiomePaletteEntry,
  BiomeTileResult,
  ColumnInfo,
  ColumnInfoInput,
  GenerateBiomeTileInput,
  ListStructuresInput,
  StructurePosition,
  SlimeChunk,
  SlimeChunkInput,
  SpawnPoint,
  SpawnPointInput,
  StructureVariant,
  StructureVariantInput,
} from '@/types/seed-map'
export const SeedMapAPI = {
  generateBiomeTile(input: GenerateBiomeTileInput): Promise<BiomeTileResult> {
    return apiInvoke<BiomeTileResult>('generate_biome_tile', { input })
  },
  listBiomePalette(mcVersion: string): Promise<BiomePaletteEntry[]> {
    return apiInvoke<BiomePaletteEntry[]>('list_biome_palette', { mcVersion })
  },
  filterSupportedVersions(versionIds: string[]): Promise<string[]> {
    return apiInvoke<string[]>('filter_supported_seed_map_versions', {
      versionIds,
    })
  },
  getSpawnPoint(input: SpawnPointInput): Promise<SpawnPoint> {
    return apiInvoke<SpawnPoint>('get_spawn_point', { input })
  },
  listSlimeChunks(input: SlimeChunkInput): Promise<SlimeChunk[]> {
    return apiInvoke<SlimeChunk[]>('list_slime_chunks', { input })
  },
  listStructures(input: ListStructuresInput): Promise<StructurePosition[]> {
    return apiInvoke<StructurePosition[]>('list_structures', { input })
  },
  listStrongholds(input: ListStructuresInput): Promise<StructurePosition[]> {
    return apiInvoke<StructurePosition[]>('list_strongholds', { input })
  },
  getColumnInfo(input: ColumnInfoInput): Promise<ColumnInfo> {
    return apiInvoke<ColumnInfo>('get_column_info', { input })
  },
  getStructureVariant(input: StructureVariantInput): Promise<StructureVariant> {
    return apiInvoke<StructureVariant>('get_structure_variant', { input })
  },
}
