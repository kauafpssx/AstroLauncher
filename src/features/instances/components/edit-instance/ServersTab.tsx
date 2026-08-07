import { Pencil, Plus, Server, Trash2 } from 'lucide-react'
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
import { tooltipProps } from '@/lib/tooltip'
import type { ServerEntryDTO } from '@/types/server'

import { ServerEditDialog } from './ServerEditDialog'
import type { EditingState } from './server-editing'

interface ServersTabProps {
  instanceId: string
}

export function ServersTab({ instanceId }: ServersTabProps) {
  const [servers, setServers] = useState<ServerEntryDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServerEntryDTO | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const load = async () => {
    try {
      setServers(await InstanceWorkspaceAPI.listServers(instanceId))
    } catch (err) {
      toast.error(`Falha ao listar servidores: ${String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    InstanceWorkspaceAPI.listServers(instanceId)
      .then((data) => !cancelled && setServers(data))
      .catch(
        (err) =>
          !cancelled &&
          toast.error(`Falha ao listar servidores: ${String(err)}`),
      )
      .finally(() => !cancelled && setIsLoading(false))
    return () => {
      cancelled = true
    }
  }, [instanceId])

  const handleSave = async () => {
    if (!editing || !editing.name.trim() || !editing.ip.trim()) return
    setIsSaving(true)
    try {
      if (editing.index === null) {
        await InstanceWorkspaceAPI.addServer(
          instanceId,
          editing.name.trim(),
          editing.ip.trim(),
        )
      } else {
        await InstanceWorkspaceAPI.updateServer(
          instanceId,
          editing.index,
          editing.name.trim(),
          editing.ip.trim(),
        )
      }
      setEditing(null)
      await load()
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await InstanceWorkspaceAPI.deleteServer(instanceId, deleteTarget.index)
      await load()
    } catch (err) {
      toast.error(`Falha ao remover: ${String(err)}`)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <TabHeader description="Servidores salvos nesta instância.">
        <Button
          size="sm"
          onClick={() => setEditing({ index: null, name: '', ip: '' })}
        >
          <Plus /> Adicionar Servidor
        </Button>
      </TabHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!isLoading && servers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground h-24 text-center"
                >
                  <Server className="mx-auto mb-2 size-6" />
                  Nenhum servidor salvo.
                </TableCell>
              </TableRow>
            )}
            {servers.map((server) => (
              <TableRow key={server.index}>
                <TableCell className="font-medium">{server.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {server.ip}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setEditing({
                          index: server.index,
                          name: server.name,
                          ip: server.ip,
                        })
                      }
                      {...tooltipProps('Editar')}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteTarget(server)}
                      {...tooltipProps('Excluir')}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ServerEditDialog
        editing={editing}
        isSaving={isSaving}
        onEditingChange={setEditing}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir servidor"
        description={
          <>
            Isso vai remover <strong>{deleteTarget?.name}</strong> da lista de
            servidores salvos.
          </>
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
