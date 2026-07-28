import { Package } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface InstanceInfoCardProps {
  name: string
  onNameChange: (name: string) => void
  group: string | null
  onGroupChange: (group: string | null) => void
}

export function InstanceInfoCard({ name, onNameChange, group, onGroupChange }: InstanceInfoCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-8 p-8">
        <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Package className="size-11 text-muted-foreground" />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-[110px_1fr] items-center gap-4">
            <Label htmlFor="instance-name" className="text-muted-foreground">
              Nome da Instância
            </Label>
            <Input
              id="instance-name"
              placeholder="Nome da Instância"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-[110px_1fr] items-center gap-4">
            <Label htmlFor="instance-group" className="text-muted-foreground">
              Grupo
            </Label>
            <Select value={group ?? 'none'} onValueChange={(v) => onGroupChange(v === 'none' ? null : v)}>
              <SelectTrigger id="instance-group" className="w-full">
                <SelectValue placeholder="Nenhum grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum grupo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Organize suas instâncias utilizando grupos para facilitar a organização.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
