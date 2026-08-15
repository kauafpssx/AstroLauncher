import { Plus, Puzzle } from 'lucide-react'

import { TabHeader } from '@/components/common/TabHeader'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ContentKind } from '@/types/mods'

import { InstalledContentBatchBar } from './InstalledContentBatchBar'
import { InstalledContentRow } from './InstalledContentRow'
import { LABELS } from './installed-content-tab.constants'
import { ModBrowserDialog } from './ModBrowserDialog'
import { useInstalledContent } from './useInstalledContent'

interface InstalledContentTabProps {
  instanceId: string
  gameVersion: string
  loader: string | null
  kind: ContentKind
}

export function InstalledContentTab({
  instanceId,
  gameVersion,
  loader,
  kind,
}: InstalledContentTabProps) {
  const labels = LABELS[kind]
  const content = useInstalledContent({ instanceId, kind })
  const {
    items,
    isLoading,
    searchOpen,
    setSearchOpen,
    load,
    handleToggle,
    handleDelete,
    selectedIds,
    selectedItems,
    allSelected,
    someSelected,
    anySelectedEnabled,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    isBatchPending,
    toggleSelected,
    toggleSelectAll,
    handleBatchToggle,
    handleBatchDelete,
  } = content

  return (
    <div className="flex flex-col gap-3">
      <TabHeader description={labels.title}>
        <Button size="sm" onClick={() => setSearchOpen(true)}>
          <Plus /> {labels.addLabel}
        </Button>
      </TabHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? 'indeterminate' : false
                  }
                  onCheckedChange={(checked) =>
                    toggleSelectAll(checked === true)
                  }
                  aria-label="Selecionar todos"
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead className="w-16">Ativo</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-24 text-center"
                >
                  <Puzzle className="mx-auto mb-2 size-6" />
                  {labels.emptyLabel}
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <InstalledContentRow
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelected={toggleSelected}
                onToggleEnabled={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <InstalledContentBatchBar
        count={selectedIds.size}
        pluralLabel={labels.pluralLabel}
        itemNames={selectedItems.map((m) => m.name)}
        anySelectedEnabled={anySelectedEnabled}
        isPending={isBatchPending}
        confirmOpen={deleteConfirmOpen}
        onConfirmOpenChange={setDeleteConfirmOpen}
        onToggle={handleBatchToggle}
        onDelete={handleBatchDelete}
        onClear={() => toggleSelectAll(false)}
      />

      <ModBrowserDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        instanceId={instanceId}
        gameVersion={gameVersion}
        loader={loader}
        kind={kind}
        onInstalled={load}
      />
    </div>
  )
}
