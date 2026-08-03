import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FolderDTO } from '@/types/folder'

import { IconPickerButton } from '../IconPickerButton'

interface InstanceInfoCardProps {
  name: string
  onNameChange: (name: string) => void
  group: string | null
  onGroupChange: (group: string | null) => void
  iconPath: string | null
  onIconChange: (iconPath: string) => void
  folders: FolderDTO[]
}

export function InstanceInfoCard({
  name,
  onNameChange,
  group,
  onGroupChange,
  iconPath,
  onIconChange,
  folders,
}: InstanceInfoCardProps) {
  return (
    <div className="flex items-center gap-8">
      <IconPickerButton
        iconPath={iconPath}
        onSelect={onIconChange}
        className="size-24 shrink-0"
        rounded="rounded-xl"
        fallbackIconClassName="size-11"
      />
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
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div className="grid grid-cols-[110px_1fr] items-center gap-4">
          <Label htmlFor="instance-group" className="text-muted-foreground">
            Grupo
          </Label>
          <Select
            value={group ?? 'none'}
            onValueChange={(v) => onGroupChange(v === 'none' ? null : v)}
          >
            <SelectTrigger id="instance-group" className="w-full">
              <SelectValue placeholder="Nenhum grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Todas as Instâncias</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground text-xs">
          Organize suas instâncias em pastas. Você pode mover instâncias entre
          pastas pela tela principal.
        </p>
      </div>
    </div>
  )
}
