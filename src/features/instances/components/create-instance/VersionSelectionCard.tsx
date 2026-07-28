import { Box, Search } from 'lucide-react'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
}

export function VersionSelectionCard({
  versions,
  isLoading,
  search,
  onSearchChange,
  typeFilters,
  selectedVersionId,
  onSelect,
}: VersionSelectionCardProps) {
  const filtered = useMemo(() => {
    return versions.filter((v) => {
      const matchesSearch = v.id.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilters.length === 0 || typeFilters.includes(v.type)
      return matchesSearch && matchesType
    })
  }, [versions, search, typeFilters])

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader className="flex-row items-center justify-between gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Box className="size-4.5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Versão do Jogo</CardTitle>
            <CardDescription>Escolha a versão base da sua instância.</CardDescription>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar versões..."
            className="pl-8"
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value)
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pt-2">
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
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
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
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
                        selected && 'border-l-primary bg-primary/10 hover:bg-primary/10',
                      )}
                    >
                      <TableCell className="font-medium">{version.id}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(version.releaseTime).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{TYPE_LABEL[version.type]}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
