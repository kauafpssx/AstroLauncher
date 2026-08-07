import { Check, Clipboard, Download, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'

import { splitExtension } from './screenshot-name'
import { ScreenshotZoomControls } from './ScreenshotZoomControls'
import { MIN_SCALE, useScreenshotZoom } from './useScreenshotZoom'

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
  const {
    scale,
    offset,
    isDragging,
    zoomBy,
    reset,
    handleWheel,
    handleDoubleClick,
    handleMouseDown,
    handleMouseMove,
    stopDragging,
  } = useScreenshotZoom(dataUri)
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)

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
      const newName = await InstanceWorkspaceAPI.renameScreenshot(
        instanceId,
        name,
        trimmed,
      )
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
            scale > MIN_SCALE
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-zoom-in',
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
            className="max-h-full max-w-full object-contain select-none"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          />

          <ScreenshotZoomControls
            scale={scale}
            onZoomBy={zoomBy}
            onReset={reset}
          />
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
              <span className="text-muted-foreground shrink-0 text-sm">
                {currentExt}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={commitRename}
                disabled={isSavingName}
                aria-label="Confirmar"
                {...tooltipProps('Confirmar')}
              >
                <Check />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsRenaming(false)}
                disabled={isSavingName}
                aria-label="Cancelar"
                {...tooltipProps('Cancelar')}
              >
                <X />
              </Button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="text-muted-foreground truncate text-sm">{name}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={startRenaming}
                aria-label="Renomear"
                {...tooltipProps('Renomear')}
              >
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
