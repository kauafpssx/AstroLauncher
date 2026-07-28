import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useLaunchStore } from '@/stores/launch.store'

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`
}

export function LaunchProgressDialog() {
  const isOpen = useLaunchStore((s) => s.isOpen)
  const stageLabel = useLaunchStore((s) => s.stageLabel)
  const progress = useLaunchStore((s) => s.progress)
  const error = useLaunchStore((s) => s.error)
  const close = useLaunchStore((s) => s.close)

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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progresso geral</span>
                <span>
                  {progress ? `${formatBytes(progress.overallCurrent)} / ${formatBytes(progress.overallTotal)}` : ''}
                </span>
              </div>
              <Progress value={overallPercent} />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{stageLabel || 'Preparando...'}</span>
                {progress && progress.stageTotal > 1 && (
                  <span>
                    {progress.stageCurrent}/{progress.stageTotal}
                  </span>
                )}
              </div>
              <Progress value={progress ? stagePercent : undefined} />
              {progress?.currentItem && <p className="truncate text-xs text-muted-foreground">{progress.currentItem}</p>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
