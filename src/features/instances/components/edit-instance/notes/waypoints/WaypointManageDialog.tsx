import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WaypointAPI } from '@/features/instances/services/waypoint.api'
import type { WaypointDTO } from '@/types/waypoint'
import { WaypointFormDialog } from './WaypointFormDialog'
import { WaypointListItem } from './WaypointListItem'
interface WaypointManageDialogProps {
  instanceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}
export function WaypointManageDialog({
  instanceId,
  open,
  onOpenChange,
}: WaypointManageDialogProps) {
  const [waypoints, setWaypoints] = useState<WaypointDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WaypointDTO | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WaypointDTO | null>(null)
  const [isPending, setIsPending] = useState(false)
  const fetchIdRef = useRef(0)
  useEffect(() => {
    if (!open) return
    const id = ++fetchIdRef.current
    queueMicrotask(() => {
      if (id === fetchIdRef.current) setIsLoading(true)
    })
    WaypointAPI.list(instanceId)
      .then((result) => {
        if (id === fetchIdRef.current) {
          setWaypoints(result)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (id === fetchIdRef.current) {
          toast.error(`Falha ao carregar waypoints: ${String(err)}`)
          setIsLoading(false)
        }
      })
  }, [open, instanceId])
  const handleCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const handleEdit = (wp: WaypointDTO) => {
    setEditing(wp)
    setFormOpen(true)
  }
  const handleFormConfirm = async (data: {
    name: string
    icon: string
    dimension: WaypointDTO['dimension']
    x: number
    y: number | null
    z: number
  }) => {
    setIsPending(true)
    try {
      if (editing) {
        const updated = await WaypointAPI.update(editing.id, data)
        setWaypoints((prev) =>
          prev.map((wp) => (wp.id === editing.id ? updated : wp)),
        )
      } else {
        const created = await WaypointAPI.create({
          instanceId,
          ...data,
        })
        setWaypoints((prev) => [...prev, created])
      }
      setFormOpen(false)
      setEditing(null)
    } catch (err) {
      toast.error(
        editing
          ? `Falha ao salvar waypoint: ${String(err)}`
          : `Falha ao criar waypoint: ${String(err)}`,
      )
    } finally {
      setIsPending(false)
    }
  }
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await WaypointAPI.delete(deleteTarget.id)
      setWaypoints((prev) => prev.filter((wp) => wp.id !== deleteTarget.id))
    } catch (err) {
      toast.error(`Falha ao excluir waypoint: ${String(err)}`)
    } finally {
      setDeleteTarget(null)
    }
  }
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[80vh] flex-col gap-3 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Waypoints</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <CenteredSpinner className="h-40" />
          ) : waypoints.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
              <p>Nenhum waypoint cadastrado.</p>
              <Button variant="outline" size="sm" onClick={handleCreate}>
                <Plus /> Criar Waypoint
              </Button>
            </div>
          ) : (
            <div className="flex-1 space-y-1 overflow-y-auto pr-1">
              {waypoints.map((wp) => (
                <WaypointListItem
                  key={wp.id}
                  waypoint={wp}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {!isLoading && waypoints.length > 0 && (
              <Button onClick={handleCreate}>
                <Plus /> Novo Waypoint
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <WaypointFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onConfirm={handleFormConfirm}
        isPending={isPending}
        initial={editing ?? undefined}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir waypoint"
        description={
          <>
            Isso vai apagar <strong>{deleteTarget?.name}</strong>{' '}
            permanentemente.
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
      />
    </>
  )
}
