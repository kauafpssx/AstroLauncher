import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WaypointDTO } from '@/types/waypoint'
import { WaypointIconPicker } from './WaypointIconPicker'
const DIMENSION_LABELS: Record<WaypointDTO['dimension'], string> = {
  overworld: 'Overworld',
  nether: 'Nether',
  end: 'End',
}
interface WaypointFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: {
    name: string
    icon: string
    dimension: WaypointDTO['dimension']
    x: number
    y: number | null
    z: number
  }) => void
  isPending?: boolean
  initial?: Partial<WaypointDTO>
}
export function WaypointFormDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  initial,
}: WaypointFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? 'MapPin')
  const [dimension, setDimension] = useState<WaypointDTO['dimension']>(
    initial?.dimension ?? 'overworld',
  )
  const [x, setX] = useState(String(initial?.x ?? ''))
  const [y, setY] = useState(initial?.y != null ? String(initial.y) : '')
  const [z, setZ] = useState(String(initial?.z ?? ''))
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(initial?.name ?? '')
      setIcon(initial?.icon ?? 'MapPin')
      setDimension(initial?.dimension ?? 'overworld')
      setX(initial?.x != null ? String(initial.x) : '')
      setY(initial?.y != null ? String(initial.y) : '')
      setZ(initial?.z != null ? String(initial.z) : '')
    }
    onOpenChange(nextOpen)
  }
  const handleConfirm = () => {
    const parsedX = Number.parseFloat(x)
    const parsedZ = Number.parseFloat(z)
    const parsedY = y.trim() === '' ? null : Number.parseFloat(y)
    if (Number.isNaN(parsedX) || Number.isNaN(parsedZ)) return
    onConfirm({
      name: name.trim(),
      icon,
      dimension,
      x: parsedX,
      y: parsedY,
      z: parsedZ,
    })
  }
  const isValid =
    name.trim().length > 0 &&
    x.trim().length > 0 &&
    z.trim().length > 0 &&
    !Number.isNaN(Number.parseFloat(x)) &&
    !Number.isNaN(Number.parseFloat(z))
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? 'Editar Waypoint' : 'Novo Waypoint'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wp-name">Nome</Label>
            <Input
              id="wp-name"
              placeholder="Casa, Base, Portal..."
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <WaypointIconPicker value={icon} onChange={setIcon} />

          <div className="flex flex-col gap-1.5">
            <Label>Dimensão</Label>
            <Select
              value={dimension}
              onValueChange={(v) => setDimension(v as WaypointDTO['dimension'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(DIMENSION_LABELS) as [
                    WaypointDTO['dimension'],
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wp-x">X</Label>
              <Input
                id="wp-x"
                type="number"
                value={x}
                onChange={(e) => setX(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wp-y">Y (opcional)</Label>
              <Input
                id="wp-y"
                type="number"
                value={y}
                onChange={(e) => setY(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wp-z">Z</Label>
              <Input
                id="wp-z"
                type="number"
                value={z}
                onChange={(e) => setZ(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!isValid || isPending} onClick={handleConfirm}>
            <MapPin />
            {initial?.id ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
