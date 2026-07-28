import { Check, Clipboard, Download, Minus, Pencil, Plus, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { cn } from '@/lib/utils'

const MIN_SCALE = 1
const MAX_SCALE = 8

function splitExtension(fileName: string): { base: string; ext: string } {
  const dot = fileName.lastIndexOf('.')
  if (dot <= 0) return { base: fileName, ext: '' }
  return { base: fileName.slice(0, dot), ext: fileName.slice(dot) }
}

interface ScreenshotViewerDialogProps {
  instanceId: string
  name: string
  dataUri: string
  onOpenChange: (open: boolean) => void
  onDownload: () => void
  onCopy: () => void
  onRenamed: (newName: string) => void
}

export function ScreenshotViewerDialog({
  instanceId,
  name,
  dataUri,
  onOpenChange,
  onDownload,
  onCopy,
  onRenamed,
}: ScreenshotViewerDialogProps) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [dataUri])

  const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))

  const zoomBy = (delta: number) => {
    setScale((prev) => {
      const next = clampScale(prev + delta)
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? 0.4 : -0.4)
  }

  const handleDoubleClick = () => {
    if (scale > MIN_SCALE) {
      setScale(MIN_SCALE)
      setOffset({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= MIN_SCALE) return
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y }
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy })
  }

  const stopDragging = () => {
    dragRef.current = null
    setIsDragging(false)
  }

  const { base: currentBase, ext: currentExt } = splitExtension(name)

  const startRenaming = () => {
    setDraftName(currentBase)
    setIsRenaming(true)
  }

  const commitRename = async () => {
    const trimmed = draftName.trim()
    if (!trimmed || trimmed === currentBase) {
      setIsRenaming(false)
      return
    }
    setIsSavingName(true)
    try {
      const newName = await InstanceWorkspaceAPI.renameScreenshot(instanceId, name, trimmed)
      onRenamed(newName)
      setIsRenaming(false)
    } catch (err) {
      toast.error(`Falha ao renomear: ${String(err)}`)
    } finally {
      setIsSavingName(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[94vh] w-[96vw] max-w-none flex-col gap-3 p-4 sm:max-w-none">
        <DialogTitle className="sr-only">{name}</DialogTitle>

        <div
          className={cn(
            'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-black/40',
            scale > MIN_SCALE ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
          )}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          <img
            src={dataUri}
            alt={name}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: dragRef.current ? 'none' : 'transform 0.1s ease-out',
            }}
          />

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/90 p-1 shadow-sm">
            <Button variant="ghost" size="icon-sm" onClick={() => zoomBy(-0.4)} disabled={scale <= MIN_SCALE}>
              <Minus />
            </Button>
            <span className="w-12 text-center text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon-sm" onClick={() => zoomBy(0.4)} disabled={scale >= MAX_SCALE}>
              <Plus />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setScale(MIN_SCALE)
                setOffset({ x: 0, y: 0 })
              }}
              disabled={scale === MIN_SCALE}
            >
              <RotateCcw />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          {isRenaming ? (
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setIsRenaming(false)
                }}
                className="h-8 max-w-64"
                disabled={isSavingName}
              />
              <span className="shrink-0 text-sm text-muted-foreground">{currentExt}</span>
              <Button variant="ghost" size="icon-sm" onClick={commitRename} disabled={isSavingName}>
                <Check />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setIsRenaming(false)} disabled={isSavingName}>
                <X />
              </Button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm text-muted-foreground">{name}</p>
              <Button variant="ghost" size="icon-sm" onClick={startRenaming}>
                <Pencil />
              </Button>
            </div>
          )}
          <div className="flex shrink-0 gap-1.5">
            <Button variant="outline" size="sm" onClick={onCopy}>
              <Clipboard /> Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download /> Baixar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
