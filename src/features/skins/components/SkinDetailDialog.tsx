import { save } from '@tauri-apps/plugin-dialog'
import { Check, Copy, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import type { SkinDetail } from '@/types/skins'

import { SkinAPI } from '../services/skin.api'
import { SkinViewer3D } from './SkinViewer3D'

interface SkinDetailDialogProps {
  hash: string | null
  onOpenChange: (open: boolean) => void
}

export function SkinDetailDialog({ hash, onOpenChange }: SkinDetailDialogProps) {
  const [detail, setDetail] = useState<SkinDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null)
  const [copyAsCommand, setCopyAsCommand] = useState(false)

  // Clear/reset during render when the selected hash changes (the effect below
  // only performs the fetch).
  const [prevHash, setPrevHash] = useState<typeof hash>(null)
  if (prevHash !== hash) {
    setPrevHash(hash)
    if (hash) {
      setIsLoading(true)
    } else {
      setDetail(null)
    }
  }

  useEffect(() => {
    if (!hash) return
    SkinAPI.getSkin(hash)
      .then(setDetail)
      .catch((err) => toast.error(`Falha ao carregar skin: ${String(err)}`))
      .finally(() => setIsLoading(false))
  }, [hash])

  const copyName = async (uuid: string, username: string) => {
    await navigator.clipboard.writeText(copyAsCommand ? `/skin set mojang ${username}` : username)
    setCopiedUuid(uuid)
    setTimeout(() => setCopiedUuid((current) => (current === uuid ? null : current)), 1500)
  }

  const downloadSkin = async () => {
    if (!detail) return
    const destPath = await save({
      defaultPath: `${detail.oldestPlayer.username || detail.hash}.png`,
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
    <Dialog open={hash !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Perfis usando esta skin</DialogTitle>
        </DialogHeader>

        {isLoading || !detail ? (
          <CenteredSpinner className="h-64" />
        ) : (
          <div className="flex gap-4">
            <SkinViewer3D skinUrl={detail.skinUrl} model={detail.model} onDownload={downloadSkin} isDownloading={isDownloading} />

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {detail.playerCount} {detail.playerCount === 1 ? 'perfil' : 'perfis'} usando essa skin
                </div>
                <Switch
                  checked={copyAsCommand}
                  onCheckedChange={setCopyAsCommand}
                  title={copyAsCommand ? 'Copiando como comando' : 'Copiar como comando'}
                />
              </div>
              <ScrollArea type="always" className="h-64 rounded-lg border">
                <div className="flex flex-col gap-0.5 p-2">
                  {detail.currentPlayers.map((player) => (
                    <div key={player.uuid} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                      <span className="truncate">{player.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        title={copyAsCommand ? 'Copiar comando' : 'Copiar nome'}
                        onClick={() => copyName(player.uuid, player.username)}
                      >
                        {copiedUuid === player.uuid ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
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
