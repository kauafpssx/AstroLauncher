import { Check, Copy, Link2, UserX, Users } from 'lucide-react'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { tooltipProps } from '@/lib/tooltip'
import type { SkinSource } from '@/types/skins'

import { SkinViewer3D } from './SkinViewer3D'
import { useSkinDetail } from './useSkinDetail'

interface SkinDetailDialogProps {
  source: SkinSource | null
  id: string | null
  onOpenChange: (open: boolean) => void
}

export function SkinDetailDialog({
  source,
  id,
  onOpenChange,
}: SkinDetailDialogProps) {
  const {
    detail,
    isLoading,
    isDownloading,
    copiedUuid,
    copyAsCommand,
    setCopyAsCommand,
    copiedUrl,
    setCopyModel,
    effectiveModel,
    copyName,
    copySkinUrlCommand,
    downloadSkin,
  } = useSkinDetail({ source, id })

  return (
    <Dialog open={id !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Perfis usando esta skin</DialogTitle>
        </DialogHeader>

        {isLoading || !detail ? (
          <CenteredSpinner className="h-64" />
        ) : (
          <div className="flex gap-4">
            <SkinViewer3D
              source={detail.source}
              skinUrl={detail.skinUrl}
              model={effectiveModel}
              onDownload={downloadSkin}
              isDownloading={isDownloading}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Users className="size-3.5" />
                  {detail.playerCount}{' '}
                  {detail.playerCount === 1 ? 'perfil' : 'perfis'} usando essa
                  skin
                </div>
                <Switch
                  checked={copyAsCommand}
                  onCheckedChange={setCopyAsCommand}
                  {...tooltipProps(
                    copyAsCommand
                      ? 'Copiando como comando'
                      : 'Copiar como comando',
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start"
                  onClick={copySkinUrlCommand}
                  {...tooltipProps(
                    'Funciona em servidores com SkinRestorer, sem precisar de nickname',
                  )}
                >
                  {copiedUrl ? <Check className="text-primary" /> : <Link2 />}
                  Copiar comando /skin
                </Button>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={effectiveModel}
                  onValueChange={(v) =>
                    v && setCopyModel(v as 'classic' | 'slim')
                  }
                >
                  <ToggleGroupItem value="classic">Classic</ToggleGroupItem>
                  <ToggleGroupItem value="slim">Slim</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <ScrollArea type="always" className="h-64 rounded-lg border">
                <div className="flex flex-col gap-0.5 p-2">
                  {detail.currentPlayers.length === 0 && (
                    <div className="text-muted-foreground flex h-56 flex-col items-center justify-center gap-2 px-6 text-center text-sm">
                      <UserX className="size-6" />
                      <p>Nenhum perfil conhecido usando essa skin.</p>
                      <p className="text-xs">
                        Use o botão "Copiar comando /skin" acima para aplicá-la
                        direto pela URL, sem precisar de nickname.
                      </p>
                    </div>
                  )}
                  {detail.currentPlayers.map((player) => (
                    <div
                      key={player.uuid}
                      className="hover:bg-accent flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                      <span className="truncate">{player.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        {...tooltipProps(
                          copyAsCommand ? 'Copiar comando' : 'Copiar nome',
                        )}
                        onClick={() => copyName(player.uuid, player.username)}
                      >
                        {copiedUuid === player.uuid ? (
                          <Check className="text-primary size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
