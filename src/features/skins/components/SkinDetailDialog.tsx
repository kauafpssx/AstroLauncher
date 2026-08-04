import { save } from '@tauri-apps/plugin-dialog'
import { Check, Copy, Link2, UserX, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
import type { SkinDetail, SkinSource } from '@/types/skins'

import { SkinAPI } from '../services/skin.api'
import { SkinViewer3D } from './SkinViewer3D'

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
  const [detail, setDetail] = useState<SkinDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)
  const [copyAsCommand, setCopyAsCommand] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  // `null` means "use the model the API reported" — set once the user
  // overrides it, since detection isn't always right (e.g. a classic skin
  // that's actually meant to be worn as slim).
  const [copyModel, setCopyModel] = useState<'classic' | 'slim' | null>(null)

  // Clear/reset during render when the selected skin changes (the effect
  // below only performs the fetch).
  const [prevId, setPrevId] = useState<typeof id>(null)
  if (prevId !== id) {
    setPrevId(id)
    setCopyModel(null)
    if (id) {
      setIsLoading(true)
    } else {
      setDetail(null)
    }
  }

  useEffect(() => {
    if (!id || !source) return
    SkinAPI.getSkin(source, id)
      .then(setDetail)
      .catch((err) => toast.error(`Falha ao carregar skin: ${String(err)}`))
      .finally(() => setIsLoading(false))
  }, [source, id])

  const copyName = async (uuid: string, username: string) => {
    await navigator.clipboard.writeText(
      copyAsCommand ? `/skin set mojang ${username}` : username,
    )
    setCopiedUuid(uuid)
    setTimeout(
      () => setCopiedUuid((current) => (current === uuid ? null : current)),
      1500,
    )
  }

  // SkinRestorer (the most common skin plugin on servers that don't use
  // Mojang accounts) can apply a skin straight from its PNG URL — no
  // username or Mojang lookup needed, which works even for skins nobody's
  // currently wearing. Syntax: `/skin set web <classic|slim> "<url>"`.
  const effectiveModel =
    copyModel ?? (detail?.model === 'slim' ? 'slim' : 'classic')

  const copySkinUrlCommand = async () => {
    if (!detail) return
    await navigator.clipboard.writeText(
      `/skin set web ${effectiveModel} "${detail.skinUrl}"`,
    )
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 1500)
  }

  const downloadSkin = async () => {
    if (!detail) return
    const urlName = detail.skinUrl.split('/').pop()?.replace(/\.png$/i, '')
    const destPath = await save({
      defaultPath: `${detail.oldestPlayer.username || urlName || 'skin'}.png`,
      filters: [{ name: 'Skin PNG', extensions: ['png'] }],
    })
    if (!destPath || Array.isArray(destPath)) return

    setIsDownloading(true)
    try {
      await SkinAPI.downloadSkin(detail.skinUrl, destPath)
      toast.success('Skin baixada')
    } catch (err) {
      toast.error(`Falha ao baixar skin: ${String(err)}`)
    } finally {
      setIsDownloading(false)
    }
  }

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
                    'Copia /skin set web <classic|slim> "<link da skin>" — funciona em servidores com SkinRestorer, sem precisar de nickname',
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
