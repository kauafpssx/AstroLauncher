import { NumberStepperInput } from '@/components/common/NumberStepperInput'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

import { MIN_MEMORY_MB } from './settings-tab-utils'

interface MemorySettingsSectionProps {
  minMemory: number
  maxMemory: number
  totalMemoryMb: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
}

export function MemorySettingsSection({
  minMemory,
  maxMemory,
  totalMemoryMb,
  onMinChange,
  onMaxChange,
}: MemorySettingsSectionProps) {
  return (
    <div className="flex flex-col gap-6 border-t pt-4">
      <div>
        <h3 className="text-sm font-medium">Memória</h3>
        <p className="text-muted-foreground text-xs">
          Quantidade de RAM alocada para a JVM ao iniciar esta instância.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <Label>Mínima</Label>
          <div className="flex items-center gap-1.5">
            <NumberStepperInput
              value={minMemory}
              min={MIN_MEMORY_MB}
              max={totalMemoryMb}
              step={256}
              onChange={onMinChange}
            />
            <span className="text-muted-foreground">MB</span>
          </div>
        </div>
        <Slider
          value={[minMemory]}
          min={MIN_MEMORY_MB}
          max={totalMemoryMb}
          step={256}
          onValueChange={([v]) => onMinChange(v)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <Label>Máxima</Label>
          <div className="flex items-center gap-1.5">
            <NumberStepperInput
              value={maxMemory}
              min={MIN_MEMORY_MB}
              max={totalMemoryMb}
              step={256}
              onChange={onMaxChange}
            />
            <span className="text-muted-foreground">MB</span>
          </div>
        </div>
        <Slider
          value={[maxMemory]}
          min={MIN_MEMORY_MB}
          max={totalMemoryMb}
          step={256}
          onValueChange={([v]) => onMaxChange(v)}
        />
      </div>
    </div>
  )
}
