import { ChevronsUpDown } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSeedDialog } from './CustomSeedDialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { seedSchema } from '@/lib/validation'
import type { SeedMapDimension, SeedMapLayer } from '@/types/seed-map'
import type { VersionDTO } from '@/types/version'
import type { WorldDTO } from '@/types/world'
const CUSTOM_SEED_VALUE = '__custom_seed__'
export function SeedMapControlsRow({
  worlds,
  selectedWorldName,
  setSelectedWorldName,
  customSeed,
  setCustomSeed,
  dimension,
  setDimension,
  mapLayer,
  setMapLayer,
  versionOverride,
  setVersionOverride,
  mcVersion,
  versions,
  isLoadingVersions,
  gotoX,
  setGotoX,
  gotoZ,
  setGotoZ,
  handleGo,
}: {
  worlds: WorldDTO[]
  selectedWorldName: string | null
  setSelectedWorldName: Dispatch<SetStateAction<string | null>>
  customSeed: string | null
  setCustomSeed: Dispatch<SetStateAction<string | null>>
  dimension: SeedMapDimension
  setDimension: Dispatch<SetStateAction<SeedMapDimension>>
  mapLayer: SeedMapLayer
  setMapLayer: Dispatch<SetStateAction<SeedMapLayer>>
  versionOverride: string
  setVersionOverride: Dispatch<SetStateAction<string>>
  mcVersion: string
  versions: VersionDTO[]
  isLoadingVersions: boolean
  gotoX: string
  setGotoX: Dispatch<SetStateAction<string>>
  gotoZ: string
  setGotoZ: Dispatch<SetStateAction<string>>
  handleGo: () => void
}) {
  const [customSeedDialogOpen, setCustomSeedDialogOpen] = useState(false)
  const [directSeed, setDirectSeed] = useState(customSeed ?? '')
  const directSeedResult = seedSchema.safeParse(directSeed)
  const directSeedError =
    directSeed === '' || directSeedResult.success
      ? null
      : (directSeedResult.error.issues[0]?.message ?? null)
  const handleDirectSeedChange = (value: string) => {
    setDirectSeed(value)
    const result = seedSchema.safeParse(value)
    setCustomSeed(result.success ? result.data : null)
  }
  const [versionPickerOpen, setVersionPickerOpen] = useState(false)
  const [versionSearch, setVersionSearch] = useState('')
  const filteredVersions = useMemo(
    () =>
      versions.filter((v) =>
        v.id.toLowerCase().includes(versionSearch.toLowerCase()),
      ),
    [versions, versionSearch],
  )
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Mundo:</Label>
        {worlds.length === 0 ? (
          <div className="flex flex-col gap-1">
            <Input
              value={directSeed}
              onChange={(e) => handleDirectSeedChange(e.target.value)}
              placeholder="Ex: 12345 ou -987654321"
              className="h-7 w-44 text-xs"
              aria-invalid={directSeedError ? true : undefined}
            />
            {directSeedError && (
              <p className="text-destructive text-xs">{directSeedError}</p>
            )}
          </div>
        ) : (
          <Select
            value={
              customSeed !== null
                ? CUSTOM_SEED_VALUE
                : (selectedWorldName ?? '')
            }
            onValueChange={(v) => {
              if (v === CUSTOM_SEED_VALUE) {
                setCustomSeedDialogOpen(true)
                return
              }
              setCustomSeed(null)
              setSelectedWorldName(v)
            }}
          >
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {worlds.map((w) => (
                <SelectItem key={w.name} value={w.name}>
                  {w.seed != null ? `${w.name} (${w.seed})` : w.name}
                </SelectItem>
              ))}
              <SelectItem value={CUSTOM_SEED_VALUE}>
                {customSeed !== null
                  ? `Seed customizada (${customSeed})`
                  : 'Seed customizada...'}
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        <CustomSeedDialog
          open={customSeedDialogOpen}
          onOpenChange={setCustomSeedDialogOpen}
          onConfirm={(seed) => setCustomSeed(seed)}
        />
      </div>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center gap-2">
        <Label className="text-xs">Dimensão:</Label>
        <Select
          value={dimension}
          onValueChange={(v) => setDimension(v as SeedMapDimension)}
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overworld">Overworld</SelectItem>
            <SelectItem value="nether">Nether</SelectItem>
            <SelectItem value="end">End</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center gap-2">
        <Label className="text-xs">Camada:</Label>
        <Select
          value={mapLayer}
          onValueChange={(v) => setMapLayer(v as SeedMapLayer)}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="surface">Superfície</SelectItem>
            <SelectItem value="underground">Subterrâneo (Y -11)</SelectItem>
            <SelectItem value="bottom">Fundo (Y -51)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center gap-2">
        <Label className="text-xs">Versão:</Label>
        <Popover
          open={versionPickerOpen}
          onOpenChange={(open) => {
            setVersionPickerOpen(open)
            if (!open) setVersionSearch('')
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              role="combobox"
              aria-expanded={versionPickerOpen}
              className="h-7 w-32 justify-between text-xs font-normal"
            >
              <span className="truncate">{versionOverride || mcVersion}</span>
              <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <SearchInput
              value={versionSearch}
              onChange={(e) => setVersionSearch(e.target.value)}
              placeholder="Buscar versão..."
              className="h-8 text-xs"
              containerClassName="mb-2"
            />
            <div className="max-h-64 overflow-y-auto">
              {isLoadingVersions && (
                <div className="text-muted-foreground px-2 py-4 text-center text-xs">
                  Carregando...
                </div>
              )}
              {!isLoadingVersions && filteredVersions.length === 0 && (
                <div className="text-muted-foreground px-2 py-4 text-center text-xs">
                  Nenhuma versão encontrada.
                </div>
              )}
              {!isLoadingVersions &&
                filteredVersions.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVersionOverride(v.id)
                      setVersionPickerOpen(false)
                    }}
                    className={cn(
                      'hover:bg-muted flex w-full items-center rounded-sm px-2 py-1.5 text-left text-xs',
                      versionOverride === v.id && 'bg-accent',
                    )}
                  >
                    {v.id}
                  </button>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center gap-1.5">
        <Label className="text-xs">X:</Label>
        <Input
          value={gotoX}
          onChange={(e) => setGotoX(e.target.value)}
          className="h-7 w-20 text-xs"
          placeholder="0"
          onKeyDown={(e) => e.key === 'Enter' && handleGo()}
        />
        <Label className="text-xs">Z:</Label>
        <Input
          value={gotoZ}
          onChange={(e) => setGotoZ(e.target.value)}
          className="h-7 w-20 text-xs"
          placeholder="0"
          onKeyDown={(e) => e.key === 'Enter' && handleGo()}
        />
        <Button size="sm" variant="secondary" onClick={handleGo}>
          Ir
        </Button>
      </div>
    </div>
  )
}
