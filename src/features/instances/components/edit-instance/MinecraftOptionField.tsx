import { NumberStepperInput } from '@/components/common/NumberStepperInput'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { floatRangeForKey, type ParsedOption } from '@/lib/minecraft-options'

const DEFAULT_DEVICE = '__default__'
const NUMBER_MIN = -1_000_000
const NUMBER_MAX = 1_000_000

interface MinecraftOptionFieldProps {
  option: ParsedOption
  value: string
  onChange: (value: string) => void
  audioDevices: string[]
}

export function MinecraftOptionField({ option, value, onChange, audioDevices }: MinecraftOptionFieldProps) {
  if (option.type === 'boolean') {
    return <Switch checked={value === 'true'} onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')} />
  }

  if (option.key === 'soundDevice') {
    return (
      <Select value={value || DEFAULT_DEVICE} onValueChange={(v) => onChange(v === DEFAULT_DEVICE ? '' : v)}>
        <SelectTrigger className="h-8 w-52 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_DEVICE}>Padrão do sistema</SelectItem>
          {audioDevices.map((device) => (
            <SelectItem key={device} value={device}>
              {device}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (option.type === 'float') {
    const [min, max] = floatRangeForKey(option.key)
    const num = Number(value) || 0
    return (
      <div className="flex w-44 shrink-0 items-center gap-2">
        <Slider
          value={[num]}
          min={min}
          max={max}
          step={0.01}
          onValueChange={([v]) => onChange(String(Math.round(v * 100) / 100))}
          className="flex-1"
        />
        <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{num.toFixed(2)}</span>
      </div>
    )
  }

  if (option.type === 'integer') {
    return (
      <NumberStepperInput value={Number(value) || 0} min={NUMBER_MIN} max={NUMBER_MAX} step={1} onChange={(v) => onChange(String(Math.round(v)))} />
    )
  }

  return (
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-40 shrink-0" autoComplete="off" spellCheck={false} />
  )
}
