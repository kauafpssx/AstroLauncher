import { ProgressGroup } from '@/components/common/ProgressGroup'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatBytes } from '@/lib/format'
import { useLaunchStore } from '@/stores/launch.store'

export function LaunchProgressDialog() {
  const isOpen = useLaunchStore((s) => s.isOpen)
  const stageLabel = useLaunchStore((s) => s.stageLabel)
  const progress = useLaunchStore((s) => s.progress)
  const error = useLaunchStore((s) => s.error)
  const close = useLaunchStore((s) => s.close)
  const cancel = useLaunchStore((s) => s.cancel)

  const overallPercent = progress ? Math.min(100, (progress.overallCurrent / Math.max(1, progress.overallTotal)) * 100) : 0
  const stagePercent = progress ? Math.min(100, (progress.stageCurrent / Math.max(1, progress.stageTotal)) * 100) : 0

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && error) close()
      }}
    >
      <DialogContent showCloseButton={!!error} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{error ? 'Erro ao iniciar o jogo' : 'Preparando instância'}</DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={close}>Fechar</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <ProgressGroup
              label="Progresso geral"
              value={overallPercent}
              rightLabel={progress ? `${formatBytes(progress.overallCurrent)} / ${formatBytes(progress.overallTotal)}` : ''}
            />

            <ProgressGroup
              label={<span className="font-medium text-foreground">{stageLabel || 'Preparando...'}</span>}
              value={progress ? stagePercent : undefined}
              rightLabel={progress && progress.stageTotal > 1 ? `${progress.stageCurrent}/${progress.stageTotal}` : undefined}
            >
              {progress?.currentItem && <p className="truncate text-xs text-muted-foreground">{progress.currentItem}</p>}
            </ProgressGroup>

            <Button variant="outline" onClick={cancel}>
              Cancelar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
