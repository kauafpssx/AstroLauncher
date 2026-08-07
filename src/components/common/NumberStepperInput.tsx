import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'

interface NumberStepperInputProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  className?: string
}

export function NumberStepperInput({
  value,
  onChange,
  min,
  max,
  step,
  className,
}: NumberStepperInputProps) {
  const [draft, setDraft] = useState(String(value))
  const isFocused = useRef(false)

  useEffect(() => {
    if (!isFocused.current) setDraft(String(value))
  }, [value])

  const clamp = (v: number) => Math.min(Math.max(v, min), max)

  const handleTextChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.-]/g, '')
    setDraft(cleaned)
    const parsed = Number(cleaned)
    if (cleaned.trim() !== '' && !Number.isNaN(parsed)) {
      onChange(clamp(parsed))
    }
  }

  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-md border',
        className,
      )}
    >
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onFocus={() => {
          isFocused.current = true
        }}
        onBlur={() => {
          isFocused.current = false
          setDraft(String(value))
        }}
        onChange={(e) => handleTextChange(e.target.value)}
        className="w-16 bg-transparent px-2 text-right text-sm tabular-nums outline-none"
      />
      <div className="flex flex-col border-l">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange(clamp(value + step))}
          disabled={value >= max}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-1/2 w-5 items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-40"
          {...tooltipProps('Aumentar')}
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => onChange(clamp(value - step))}
          disabled={value <= min}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-1/2 w-5 items-center justify-center border-t transition-colors disabled:pointer-events-none disabled:opacity-40"
          {...tooltipProps('Diminuir')}
        >
          <ChevronDown className="size-3" />
        </button>
      </div>
    </div>
  )
}
