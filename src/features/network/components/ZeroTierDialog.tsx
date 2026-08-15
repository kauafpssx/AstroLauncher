import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useAppEnvConfig } from '@/lib/app-config'
import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useZeroTier } from '@/features/network/hooks/useZeroTier'
import { ZeroTierAPI } from '@/features/network/services/zerotier.api'
import { JoinNetworkForm } from '@/features/network/components/JoinNetworkForm'
import { LocalNetworksSection } from '@/features/network/components/LocalNetworksSection'
import { PendingMembersSection } from '@/features/network/components/PendingMembersSection'
import { ZeroTierTokenDialog } from '@/features/network/components/ZeroTierTokenDialog'

interface ZeroTierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ZeroTierDialog({ open, onOpenChange }: ZeroTierDialogProps) {
  const { status, isLoading, leavingNetworkId, refreshStatus, join, leave } =
    useZeroTier(open)
  const isLeaving = leavingNetworkId !== null
  const env = useAppEnvConfig()
  const [apiToken, setApiToken] = useState('')
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [tokenInvalid, setTokenInvalid] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [activeTab, setActiveTab] = useState('join')
  const isBusy = isLeaving || isInstalling

  useEffect(() => {
    if (!open) return
    SettingsAPI.get().then((settings) =>
      setApiToken(settings.zerotierApiToken ?? ''),
    )
  }, [open])

  const submitToken = async (token: string) => {
    const settings = await SettingsAPI.get()
    await SettingsAPI.update({
      curseforgeApiKey: settings.curseforgeApiKey,
      mcstatApiKey: settings.mcstatApiKey,
      zerotierApiToken: token,
    })
    setApiToken(token)
    setTokenInvalid(false)
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await ZeroTierAPI.install()
      toast.success('ZeroTier One instalado.')
      await refreshStatus()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setIsInstalling(false)
    }
  }

  // Leaving a network or installing ZeroTier One both take a moment (daemon
  // teardown / elevated installer): closing the dialog or switching tabs
  // mid-action would abandon it with no way to see it finish, so both stay
  // blocked until it settles — same idea as `useModpackInstallStore` blocking
  // navigation during a modpack install.
  const handleOpenChange = (next: boolean) => {
    if (isBusy) return
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={!isBusy}
        onEscapeKeyDown={(e) => isBusy && e.preventDefault()}
        onInteractOutside={(e) => isBusy && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Rede (ZeroTier)</DialogTitle>
          <DialogDescription>
            Entre em uma rede ZeroTier para jogar com amigos como se estivessem
            na mesma LAN.
          </DialogDescription>
        </DialogHeader>

        {isLoading && !status ? (
          <div className="py-6" />
        ) : status && !status.installed ? (
          <EmptyState
            title="ZeroTier One não está instalado"
            description="É necessário instalar o driver de rede do ZeroTier (o Windows vai pedir confirmação de administrador)."
            action={
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={isInstalling}
                  onClick={handleInstall}
                >
                  {isInstalling ? 'Instalando...' : 'Instalar automaticamente'}
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={env?.zerotierDownloadPage ?? ''}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={isInstalling}
                    onClick={(e) => isInstalling && e.preventDefault()}
                    className={
                      isInstalling
                        ? 'pointer-events-none opacity-50'
                        : undefined
                    }
                  >
                    Baixar manualmente
                  </a>
                </Button>
              </div>
            }
          />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(next) => {
              if (isLeaving) return
              setActiveTab(next)
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="join" disabled={isLeaving}>
                Entrar em uma rede
              </TabsTrigger>
              <TabsTrigger value="manage" disabled={isLeaving}>
                Minhas redes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="join" className="flex flex-col gap-3">
              <JoinNetworkForm
                joinedNetworkIds={(status?.networks ?? []).map((n) => n.id)}
                disabled={isLeaving}
                onJoin={join}
              />
              <LocalNetworksSection
                networks={status?.networks ?? []}
                leavingNetworkId={leavingNetworkId}
                onLeave={leave}
              />
            </TabsContent>
            <TabsContent value="manage" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Aprove quem pede entrada nas redes que você administra.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLeaving}
                  onClick={() => setTokenDialogOpen(true)}
                >
                  {apiToken ? 'Trocar token' : 'Configurar token'}
                </Button>
              </div>
              <PendingMembersSection
                hasToken={Boolean(apiToken)}
                onOpenTokenDialog={() => setTokenDialogOpen(true)}
                onInvalidToken={() => setTokenInvalid(true)}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>

      <ZeroTierTokenDialog
        open={tokenDialogOpen}
        currentToken={apiToken}
        invalidToken={tokenInvalid}
        onOpenChange={setTokenDialogOpen}
        onSubmit={submitToken}
      />
    </Dialog>
  )
}
