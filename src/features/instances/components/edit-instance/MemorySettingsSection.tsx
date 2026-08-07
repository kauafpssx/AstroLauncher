import { NumberStepperInput } from '@/components/common/NumberStepperInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { SuggestedMemoryDTO } from '@/types/instance'

import { MIN_MEMORY_MB } from './settings-tab-utils'

interface MemorySettingsSectionProps {
  minMemory: number
  maxMemory: number
  totalMemoryMb: number
  suggestedMemory: SuggestedMemoryDTO | null
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
  onUseSuggested: () => void
}

export function MemorySettingsSection({
  minMemory,
  maxMemory,
  totalMemoryMb,
  suggestedMemory,
  onMinChange,
  onMaxChange,
  onUseSuggested,
}: MemorySettingsSectionProps) {
  const isSuggested =
    !!suggestedMemory &&
    minMemory === suggestedMemory.minMb &&
    maxMemory === suggestedMemory.maxMb
  // If the suggestion doesn't fit in the machine's total RAM, applying it
  // gets clamped down to `totalMemoryMb` by the caller — the applied values
  // would then never match `suggestedMemory` above, so `isSuggested` could
  // never become true and the button would stay stuck on screen forever.
  const suggestionFits =
    !!suggestedMemory && suggestedMemory.maxMb <= totalMemoryMb

  return (
    <div className="flex flex-col gap-6 border-t pt-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">Memória</h3>
          <p className="text-muted-foreground text-xs">
            Quantidade de RAM alocada para a JVM ao iniciar esta instância.
          </p>
        </div>
        {suggestedMemory && !isSuggested && suggestionFits && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={onUseSuggested}
          >
            Usar sugerido ({suggestedMemory.minMb} a {suggestedMemory.maxMb} MB)
          </Button>
        )}
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
