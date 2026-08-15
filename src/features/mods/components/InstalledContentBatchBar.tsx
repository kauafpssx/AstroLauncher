import { Power, PowerOff, Trash2, X } from 'lucide-react'

import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { Button } from '@/components/ui/button'
import { tooltipProps } from '@/lib/tooltip'

const MAX_DESCRIBED_NAMES = 5

function describeNames(names: string[]) {
  if (names.length <= MAX_DESCRIBED_NAMES) return names.join(', ')
  return `${names.slice(0, MAX_DESCRIBED_NAMES).join(', ')} e mais ${names.length - MAX_DESCRIBED_NAMES}`
}

interface InstalledContentBatchBarProps {
  count: number
  pluralLabel: string
  itemNames: string[]
  /** Whether any selected item is still enabled: drives the toggle label/icon
   * (any enabled -> the action is "disable"). */
  anySelectedEnabled: boolean
  isPending: boolean
  confirmOpen: boolean
  onConfirmOpenChange: (open: boolean) => void
  onToggle: () => void
  onDelete: () => void
  onClear: () => void
}

/** Floating bottom bar with batch actions for the selected installed items,
 * plus the delete-confirmation dialog. Rendered as a fragment so the dialog
 * can live next to the bar even when the bar itself is hidden. */
export function InstalledContentBatchBar({
  count,
  pluralLabel,
  itemNames,
  anySelectedEnabled,
  isPending,
  confirmOpen,
  onConfirmOpenChange,
  onToggle,
  onDelete,
  onClear,
}: InstalledContentBatchBarProps) {
  return (
    <>
      {count > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-6 left-1/2 z-50 -translate-x-1/2 duration-200">
          <div className="bg-popover text-popover-foreground flex items-center gap-1 rounded-full border p-1.5 shadow-lg">
            <span className="text-muted-foreground pr-1 pl-2 text-xs font-medium">
              {count} selecionado{count > 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              disabled={isPending}
              aria-label={
                anySelectedEnabled
                  ? 'Desativar selecionados'
                  : 'Ativar selecionados'
              }
              {...tooltipProps(
                anySelectedEnabled
                  ? 'Desativar selecionados'
                  : 'Ativar selecionados',
              )}
            >
              {anySelectedEnabled ? <PowerOff /> : <Power />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onConfirmOpenChange(true)}
              disabled={isPending}
              aria-label="Excluir selecionados"
              {...tooltipProps('Excluir selecionados')}
            >
              <Trash2 className="text-destructive" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClear}
              aria-label="Limpar seleção"
              {...tooltipProps('Limpar seleção')}
            >
              <X />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={onConfirmOpenChange}
        title={`Excluir ${count} ${count === 1 ? 'item' : 'itens'}?`}
        description={`Os ${pluralLabel} selecionados serão removidos desta instância: ${describeNames(
          itemNames,
        )}`}
        confirmLabel={`Excluir ${count}`}
        isPending={isPending}
        onConfirm={onDelete}
      />
    </>
  )
}
