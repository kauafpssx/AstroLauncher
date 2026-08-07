import { FolderOpen, Globe, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { TabHeader } from '@/components/common/TabHeader'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { formatBytes } from '@/lib/format'
import { tooltipProps } from '@/lib/tooltip'
import type { WorldDTO } from '@/types/world'

interface WorldsTabProps {
  instanceId: string
}

export function WorldsTab({ instanceId }: WorldsTabProps) {
  const [worlds, setWorlds] = useState<WorldDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = async () => {
    try {
      setWorlds(await InstanceWorkspaceAPI.listWorlds(instanceId))
    } catch (err) {
      toast.error(`Falha ao listar mundos: ${String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    InstanceWorkspaceAPI.listWorlds(instanceId)
      .then((data) => !cancelled && setWorlds(data))
      .catch(
        (err) =>
          !cancelled && toast.error(`Falha ao listar mundos: ${String(err)}`),
      )
      .finally(() => !cancelled && setIsLoading(false))
    return () => {
      cancelled = true
    }
  }, [instanceId])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await InstanceWorkspaceAPI.deleteWorld(instanceId, deleteTarget)
      setWorlds((prev) => prev.filter((w) => w.name !== deleteTarget))
    } catch (err) {
      toast.error(`Falha ao excluir: ${String(err)}`)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <TabHeader description="Mundos salvos nesta instância.">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLoading(true)
            load()
          }}
        >
          <RefreshCw /> Atualizar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => InstanceWorkspaceAPI.openFolder(instanceId)}
        >
          <FolderOpen /> Abrir Pasta
        </Button>
      </TabHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Última modificação</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && worlds.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground h-24 text-center"
                >
                  <Globe className="mx-auto mb-2 size-6" />
                  Nenhum mundo encontrado.
                </TableCell>
              </TableRow>
            )}
            {worlds.map((world) => (
              <TableRow key={world.name}>
                <TableCell className="font-medium">{world.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatBytes(world.sizeBytes)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {world.lastModified
                    ? new Date(world.lastModified).toLocaleString('pt-BR')
                    : '—'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteTarget(world.name)}
                    {...tooltipProps('Excluir')}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir mundo"
        description={
          <>
            Isso vai apagar <strong>{deleteTarget}</strong> permanentemente.
            Essa ação não pode ser desfeita.
          </>
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
