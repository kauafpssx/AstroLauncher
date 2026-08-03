import { Pencil, Plus, Server, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import type { ServerEntryDTO } from '@/types/server'

interface ServersTabProps {
  instanceId: string
}

interface EditingState {
  index: number | null
  name: string
  ip: string
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
      .catch((err) => !cancelled && toast.error(`Falha ao listar servidores: ${String(err)}`))
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
        await InstanceWorkspaceAPI.addServer(instanceId, editing.name.trim(), editing.ip.trim())
      } else {
        await InstanceWorkspaceAPI.updateServer(instanceId, editing.index, editing.name.trim(), editing.ip.trim())
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
      toast.success('Servidor removido')
      await load()
    } catch (err) {
      toast.error(`Falha ao remover: ${String(err)}`)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Servidores salvos nesta instância.</p>
        <Button size="sm" onClick={() => setEditing({ index: null, name: '', ip: '' })}>
          <Plus /> Adicionar Servidor
        </Button>
      </div>

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
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  <Server className="mx-auto mb-2 size-6" />
                  Nenhum servidor salvo.
                </TableCell>
              </TableRow>
            )}
            {servers.map((server) => (
              <TableRow key={server.index}>
                <TableCell className="font-medium">{server.name}</TableCell>
                <TableCell className="text-muted-foreground">{server.ip}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditing({ index: server.index, name: server.name, ip: server.ip })}
                    >
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(server)}>
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing?.index === null ? 'Adicionar Servidor' : 'Editar Servidor'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="server-name">Nome</Label>
              <Input
                id="server-name"
                value={editing?.name ?? ''}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="server-ip">Endereço (IP:porta)</Label>
              <Input
                id="server-ip"
                placeholder="play.exemplo.com"
                value={editing?.ip ?? ''}
                onChange={(e) => setEditing((prev) => (prev ? { ...prev, ip: e.target.value } : prev))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button disabled={!editing?.name.trim() || !editing?.ip.trim() || isSaving} onClick={handleSave}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir servidor"
        description={
          <>
            Isso vai remover <strong>{deleteTarget?.name}</strong> da lista de servidores salvos.
          </>
        }
        onConfirm={handleDelete}
      />
    </div>
  )
}
