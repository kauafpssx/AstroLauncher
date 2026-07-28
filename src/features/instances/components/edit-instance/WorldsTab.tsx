import { FolderOpen, Globe, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import type { WorldDTO } from '@/types/world'

interface WorldsTabProps {
  instanceId: string
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`
}

export function WorldsTab({ instanceId }: WorldsTabProps) {
  const [worlds, setWorlds] = useState<WorldDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = async () => {
    setIsLoading(true)
    try {
      setWorlds(await InstanceWorkspaceAPI.listWorlds(instanceId))
    } catch (err) {
      toast.error(`Falha ao listar mundos: ${String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await InstanceWorkspaceAPI.deleteWorld(instanceId, deleteTarget)
      setWorlds((prev) => prev.filter((w) => w.name !== deleteTarget))
      toast.success('Mundo excluído')
    } catch (err) {
      toast.error(`Falha ao excluir: ${String(err)}`)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Mundos salvos nesta instância.</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw /> Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => InstanceWorkspaceAPI.openFolder(instanceId)}>
            <FolderOpen /> Abrir Pasta
          </Button>
        </div>
      </div>

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
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  <Globe className="mx-auto mb-2 size-6" />
                  Nenhum mundo encontrado.
                </TableCell>
              </TableRow>
            )}
            {worlds.map((world) => (
              <TableRow key={world.name}>
                <TableCell className="font-medium">{world.name}</TableCell>
                <TableCell className="text-muted-foreground">{formatSize(world.sizeBytes)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {world.lastModified ? new Date(world.lastModified).toLocaleString('pt-BR') : '—'}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(world.name)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mundo</AlertDialogTitle>
            <AlertDialogDescription>
              Isso vai apagar <strong>{deleteTarget}</strong> permanentemente. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
