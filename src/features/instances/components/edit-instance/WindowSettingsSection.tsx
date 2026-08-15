import { availableMonitors } from '@tauri-apps/api/window'
import type { Monitor } from '@tauri-apps/api/window'
import { useEffect, useState } from 'react'

import { NumberStepperInput } from '@/components/common/NumberStepperInput'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import {
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MAX_WINDOW_HEIGHT,
  MAX_WINDOW_WIDTH,
  MIN_WINDOW_SIZE,
} from './settings-tab-utils'

const AUTO_MONITOR = 'auto'

interface WindowSettingsSectionProps {
  fullscreen: boolean
  windowWidth: number | null
  windowHeight: number | null
  windowMonitor: string | null
  onFullscreenChange: (value: boolean) => void
  onWindowWidthChange: (value: number) => void
  onWindowHeightChange: (value: number) => void
  onWindowMonitorChange: (value: string | null) => void
}

export function WindowSettingsSection({
  fullscreen,
  windowWidth,
  windowHeight,
  windowMonitor,
  onFullscreenChange,
  onWindowWidthChange,
  onWindowHeightChange,
  onWindowMonitorChange,
}: WindowSettingsSectionProps) {
  const [monitors, setMonitors] = useState<Monitor[]>([])

  useEffect(() => {
    let cancelled = false
    availableMonitors()
      .then((list) => {
        if (!cancelled) setMonitors(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const selectedMonitor = monitors.find((m) => m.name === windowMonitor)
  const maxWidth = selectedMonitor?.size.width ?? MAX_WINDOW_WIDTH
  const maxHeight = selectedMonitor?.size.height ?? MAX_WINDOW_HEIGHT

  const handleMonitorChange = (value: string) => {
    const monitor = value === AUTO_MONITOR ? null : value
    onWindowMonitorChange(monitor)

    const size = monitors.find((m) => m.name === monitor)?.size
    if (!size) return
    onWindowWidthChange(size.width)
    onWindowHeightChange(size.height)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">Janela do Jogo</h3>
        <p className="text-muted-foreground text-xs">
          Como a janela abre ao iniciar.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="edit-fullscreen">Tela cheia</Label>
          <Switch
            id="edit-fullscreen"
            checked={fullscreen}
            onCheckedChange={onFullscreenChange}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className={fullscreen ? 'text-muted-foreground' : undefined}>
            Resolução
          </Label>
          <div className="flex shrink-0 items-center gap-1.5">
            <NumberStepperInput
              value={windowWidth ?? DEFAULT_WINDOW_WIDTH}
              min={MIN_WINDOW_SIZE}
              max={maxWidth}
              step={10}
              onChange={onWindowWidthChange}
              disabled={fullscreen}
            />
            <span className="text-muted-foreground text-xs">×</span>
            <NumberStepperInput
              value={windowHeight ?? DEFAULT_WINDOW_HEIGHT}
              min={MIN_WINDOW_SIZE}
              max={maxHeight}
              step={10}
              onChange={onWindowHeightChange}
              disabled={fullscreen}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-monitor">Monitor</Label>
          <Select
            value={windowMonitor ?? AUTO_MONITOR}
            onValueChange={handleMonitorChange}
          >
            <SelectTrigger id="edit-monitor" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AUTO_MONITOR}>Automático</SelectItem>
              {monitors.map((monitor, index) => (
                <SelectItem
                  key={monitor.name ?? index}
                  value={monitor.name ?? `monitor-${index}`}
                  disabled={!monitor.name}
                >
                  {monitor.name ?? `Monitor ${index + 1}`} ({monitor.size.width}
                  ×{monitor.size.height})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
