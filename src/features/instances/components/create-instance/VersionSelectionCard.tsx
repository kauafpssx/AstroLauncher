import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'

import { SearchInput } from '@/components/common/SearchInput'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/format'
import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'
import type { VersionDTO, VersionType } from '@/types/version'

const TYPE_LABEL: Record<VersionType, string> = {
  release: 'Release',
  snapshot: 'Snapshot',
  old_beta: 'Beta',
  old_alpha: 'Alpha',
}

interface VersionSelectionCardProps {
  versions: VersionDTO[]
  isLoading: boolean
  search: string
  onSearchChange: (search: string) => void
  typeFilters: VersionType[]
  selectedVersionId: string | null
  onSelect: (version: VersionDTO) => void
  onRefresh: () => void
}

export function VersionSelectionCard({
  versions,
  isLoading,
  search,
  onSearchChange,
  typeFilters,
  selectedVersionId,
  onSelect,
  onRefresh,
}: VersionSelectionCardProps) {
  const filtered = useMemo(() => {
    return versions.filter((v) => {
      const matchesSearch = v.id.toLowerCase().includes(search.toLowerCase())
      const matchesType =
        typeFilters.length === 0 || typeFilters.includes(v.type)
      return matchesSearch && matchesType
    })
  }, [versions, search, typeFilters])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-medium">Versão do Jogo</h3>
          <p className="text-muted-foreground text-sm">
            Escolha a versão base da sua instância.
          </p>
        </div>
        <div className="flex flex-1 items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            {...tooltipProps('Atualizar versões')}
            onClick={onRefresh}
          >
            <RefreshCw />
          </Button>
          <SearchInput
            containerClassName="min-w-40 max-w-64 flex-1"
            placeholder="Pesquisar versões..."
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value)
            }}
          />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-background sticky top-0">
              <TableRow>
                <TableHead>Versão</TableHead>
                <TableHead>Lançamento</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={3}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-muted-foreground h-32 text-center"
                  >
                    Nenhuma versão encontrada.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtered.map((version) => {
                  const selected = selectedVersionId === version.id
                  return (
                    <TableRow
                      key={version.id}
                      onClick={() => onSelect(version)}
                      className={cn(
                        'cursor-pointer border-l-2 border-l-transparent',
                        selected &&
                          'border-l-primary bg-primary/10 hover:bg-primary/10',
                      )}
                    >
                      <TableCell className="font-medium">
                        {version.id}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(version.releaseTime)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TYPE_LABEL[version.type]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
