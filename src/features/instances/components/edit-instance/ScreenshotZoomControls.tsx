import { Minus, Plus, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { MAX_SCALE, MIN_SCALE } from './useScreenshotZoom'

interface ScreenshotZoomControlsProps {
  scale: number
  onZoomBy: (delta: number) => void
  onReset: () => void
}

export function ScreenshotZoomControls({
  scale,
  onZoomBy,
  onReset,
}: ScreenshotZoomControlsProps) {
  return (
    <div className="bg-background/90 absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border p-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onZoomBy(-0.4)}
        disabled={scale <= MIN_SCALE}
      >
        <Minus />
      </Button>
      <span className="text-muted-foreground w-12 text-center text-xs">
        {Math.round(scale * 100)}%
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onZoomBy(0.4)}
        disabled={scale >= MAX_SCALE}
      >
        <Plus />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onReset}
        disabled={scale === MIN_SCALE}
      >
        <RotateCcw />
      </Button>
    </div>
  )
}
