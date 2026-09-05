import type { Dispatch, SetStateAction } from 'react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { StructureMetadata } from '@/data/structure-metadata'
interface StructureSearchDialogProps {
  structureSearchOpen: boolean
  setStructureSearchOpen: Dispatch<SetStateAction<boolean>>
  structureSearchQuery: string
  setStructureSearchQuery: Dispatch<SetStateAction<string>>
  structuresForDimension: StructureMetadata[]
  enabledStructureIds: Set<string>
  handleSelectStructureSearch: (id: string) => void
}
export function StructureSearchDialog({
  structureSearchOpen,
  setStructureSearchOpen,
  structureSearchQuery,
  setStructureSearchQuery,
  structuresForDimension,
  enabledStructureIds,
  handleSelectStructureSearch,
}: StructureSearchDialogProps) {
  return (
    <CommandDialog
      open={structureSearchOpen}
      onOpenChange={(open) => {
        setStructureSearchOpen(open)
        if (!open) setStructureSearchQuery('')
      }}
      title="Buscar estrutura"
      description="Busque uma estrutura pra focar no mapa"
    >
      <Command>
        <CommandInput
          placeholder="Buscar estrutura..."
          value={structureSearchQuery}
          onValueChange={setStructureSearchQuery}
        />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup>
            {structuresForDimension
              .filter((s) => s.cubiomesType || s.id === 'stronghold')
              .map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.labelPt}
                  onSelect={() => handleSelectStructureSearch(s.id)}
                  className={cn(
                    'gap-2',
                    enabledStructureIds.has(s.id) && 'bg-accent',
                  )}
                >
                  <img src={s.iconPath} alt="" className="size-5 shrink-0" />
                  {s.labelPt}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
