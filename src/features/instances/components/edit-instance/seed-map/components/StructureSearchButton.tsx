import { Search, X } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { STRUCTURE_BY_ID } from './seed-map-shared'
export function StructureSearchButton({
  targetedStructureId,
  setStructureSearchOpen,
  handleClearStructureSearch,
}: {
  targetedStructureId: string | null
  setStructureSearchOpen: Dispatch<SetStateAction<boolean>>
  handleClearStructureSearch: () => void
}) {
  const structure = targetedStructureId
    ? STRUCTURE_BY_ID.get(targetedStructureId)
    : undefined
  return (
    <div className="bg-background absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full border pr-1.5 shadow-sm">
      <button
        type="button"
        onClick={() => setStructureSearchOpen(true)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-full py-1 pr-1 pl-2 text-xs"
      >
        {structure ? (
          <img src={structure.iconPath} alt="" className="size-3.5 shrink-0" />
        ) : (
          <Search className="size-3.5 shrink-0" />
        )}
        <span>{structure ? structure.labelPt : 'Buscar estruturas'}</span>
      </button>
      {targetedStructureId && (
        <button
          type="button"
          onClick={handleClearStructureSearch}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
