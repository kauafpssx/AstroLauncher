import { Lock } from 'lucide-react'
import { CharacterCounter } from '@/components/common/CharacterCounter'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX } from '@/lib/validation'
import { IconPickerButton } from '@/features/instances/components/icon-picker/IconPickerButton'
interface InstanceInfoSectionProps {
  name: string
  version: string
  iconPath: string | null
  onNameChange: (name: string) => void
  onIconChange: (path: string) => void
}
export function InstanceInfoSection({
  name,
  version,
  iconPath,
  onNameChange,
  onIconChange,
}: InstanceInfoSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Informações</h3>
      <div className="flex items-stretch gap-4">
        <IconPickerButton
          iconPath={iconPath}
          onSelect={onIconChange}
          className="w-28 shrink-0 self-stretch overflow-hidden"
          rounded="rounded-xl"
          fallbackIconClassName="size-10"
        />

        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nome da Instância</Label>
            <Input
              id="edit-name"
              maxLength={MAX.INSTANCE_NAME}
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <CharacterCounter
              value={name}
              max={MAX.INSTANCE_NAME}
              className="self-end"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5">
              Versão
              <Lock className="text-muted-foreground size-3" />
            </Label>
            <div className="bg-muted text-muted-foreground flex h-9 items-center rounded-md border px-3 text-sm">
              {version}
            </div>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Não é possível alterar a versão de uma instância existente. Crie uma
        nova instância para usar outra versão.
      </p>
    </div>
  )
}
