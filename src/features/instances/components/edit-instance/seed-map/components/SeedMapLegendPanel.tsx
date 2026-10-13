import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import { SearchInput } from '@/components/common/SearchInput'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  BIOME_CATEGORY_LABELS_PT,
  type BiomeCategory,
} from '@/data/biome-metadata'
import type { StructureMetadata } from '@/data/structure-metadata'
import type { BiomePaletteEntry, SeedMapDimension } from '@/types/seed-map'
import { BiomeHighlightRow } from './BiomeHighlightRow'
import { DraggableCategoryChips } from './DraggableCategoryChips'
import { LayerToggle } from './LayerToggle'
import { StructureRow } from './StructureRow'
export function SeedMapLegendPanel({
  categorizedPalette,
  highlightedBiomeIds,
  handleToggleBiomeHighlight,
  getBiomeDisplayName,
  biomeSearch,
  setBiomeSearch,
  presentBiomeCategories,
  activeBiomeCategories,
  handleCategoryFilterChange,
  showSpawn,
  setShowSpawn,
  showSlimeChunks,
  handleToggleSlimeChunks,
  dimension,
  structuresForDimension,
  enabledStructureIds,
  handleToggleStructure,
}: {
  categorizedPalette: {
    category: BiomeCategory
    entries: BiomePaletteEntry[]
  }[]
  highlightedBiomeIds: Set<number>
  handleToggleBiomeHighlight: (id: number, checked: boolean) => void
  getBiomeDisplayName: (entry: BiomePaletteEntry) => string
  biomeSearch: string
  setBiomeSearch: Dispatch<SetStateAction<string>>
  presentBiomeCategories: BiomeCategory[]
  activeBiomeCategories: Set<BiomeCategory>
  handleCategoryFilterChange: (next: Set<BiomeCategory>) => void
  showSpawn: boolean
  setShowSpawn: Dispatch<SetStateAction<boolean>>
  showSlimeChunks: boolean
  handleToggleSlimeChunks: (checked: boolean) => void
  dimension: SeedMapDimension
  structuresForDimension: StructureMetadata[]
  enabledStructureIds: Set<string>
  handleToggleStructure: (id: string, checked: boolean) => void
}) {
  const [structureSearch, setStructureSearch] = useState('')
  const filteredStructures = useMemo(
    () =>
      structuresForDimension.filter((s) =>
        s.labelPt.toLowerCase().includes(structureSearch.toLowerCase()),
      ),
    [structuresForDimension, structureSearch],
  )
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border p-3">
      <Tabs defaultValue="biome" className="min-h-0 min-w-0 flex-1">
        <TabsList className="w-full">
          <TabsTrigger value="biome">Bioma</TabsTrigger>
          <TabsTrigger value="structures">Estruturas</TabsTrigger>
        </TabsList>
        <TabsContent
          value="biome"
          className="flex min-h-0 min-w-0 flex-col gap-2"
        >
          <TooltipProvider>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto pr-1">
              {categorizedPalette.map(({ category, entries }) => (
                <div key={category} className="flex flex-col gap-1">
                  <div className="border-border/60 text-muted-foreground border-b pt-1 pb-0.5 text-[10px] font-medium tracking-wide uppercase">
                    {BIOME_CATEGORY_LABELS_PT[category]}
                  </div>
                  {entries.map((entry) => (
                    <BiomeHighlightRow
                      key={entry.id}
                      entry={entry}
                      displayName={getBiomeDisplayName(entry)}
                      checked={highlightedBiomeIds.has(entry.id)}
                      onCheckedChange={(v) =>
                        handleToggleBiomeHighlight(entry.id, v)
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </TooltipProvider>
          <SearchInput
            value={biomeSearch}
            onChange={(e) => setBiomeSearch(e.target.value)}
            placeholder="Buscar bioma..."
            className="h-7 text-xs"
          />
          {presentBiomeCategories.length > 0 && (
            <DraggableCategoryChips
              categories={presentBiomeCategories}
              selected={activeBiomeCategories}
              onValueChange={handleCategoryFilterChange}
            />
          )}
        </TabsContent>
        <TabsContent
          value="structures"
          className="flex min-h-0 min-w-0 flex-col gap-2"
        >
          <TooltipProvider>
            <div className="flex flex-col gap-1 pr-1">
              <LayerToggle
                label="Ponto de Spawn"
                iconPath="/seed-map/icons-128/spawn-point.png"
                basePath="/seed-map/bases/spawn-point-base.png"
                checked={showSpawn}
                onCheckedChange={setShowSpawn}
                disabled={dimension !== 'overworld'}
              />
              <LayerToggle
                label="Slime Chunks"
                iconPath="/seed-map/icons-128/slime-chunk.png"
                basePath="/seed-map/bases/slime-chunk-base.png"
                checked={showSlimeChunks}
                onCheckedChange={handleToggleSlimeChunks}
                disabled={dimension !== 'overworld'}
              />
            </div>
            <Separator />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto pr-1">
              {filteredStructures.map((structure) => (
                <StructureRow
                  key={structure.id}
                  structure={structure}
                  checked={enabledStructureIds.has(structure.id)}
                  onCheckedChange={(v) =>
                    handleToggleStructure(structure.id, v)
                  }
                />
              ))}
            </div>
          </TooltipProvider>
          <SearchInput
            value={structureSearch}
            onChange={(e) => setStructureSearch(e.target.value)}
            placeholder="Buscar estrutura..."
            className="h-7 text-xs"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
