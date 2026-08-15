import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import type { LocalNetworkDTO, LocalNetworkStatus } from '@/types/zerotier'

const STATUS_LABEL: Record<LocalNetworkStatus, string> = {
  OK: 'Conectado',
  REQUESTING_CONFIGURATION: 'Aguardando aprovação',
  ACCESS_DENIED: 'Acesso negado',
  NOT_FOUND: 'Não encontrada',
  PORT_ERROR: 'Erro de porta',
  CLIENT_TOO_OLD: 'Cliente desatualizado',
  AUTHENTICATION_REQUIRED: 'Autenticação necessária',
}

const STATUS_VARIANT: Record<
  LocalNetworkStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  OK: 'default',
  REQUESTING_CONFIGURATION: 'secondary',
  ACCESS_DENIED: 'destructive',
  NOT_FOUND: 'destructive',
  PORT_ERROR: 'destructive',
  CLIENT_TOO_OLD: 'destructive',
  AUTHENTICATION_REQUIRED: 'destructive',
}

interface LocalNetworksSectionProps {
  networks: LocalNetworkDTO[]
  leavingNetworkId: string | null
  onLeave: (networkId: string) => Promise<void>
}

export function LocalNetworksSection({
  networks,
  leavingNetworkId,
  onLeave,
}: LocalNetworksSectionProps) {
  if (networks.length === 0) {
    return (
      <EmptyState
        title="Nenhuma rede conectada"
        description="Entre em uma rede pelo ID acima."
        className="py-6"
      />
    )
  }

  const handleLeave = async (id: string) => {
    try {
      await onLeave(id)
    } catch (err) {
      toast.error(String(err))
    }
  }

  const handleCopyId = async (id: string) => {
    await navigator.clipboard.writeText(id)
    toast.success('ID da rede copiado.')
  }

  const isBusy = leavingNetworkId !== null

  return (
    <div className="flex flex-col gap-2">
      {networks.map((network) => {
        const isLeaving = leavingNetworkId === network.id
        return (
          <div
            key={network.id}
            className="flex items-center justify-between gap-2 rounded-md border p-2"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">
                {network.name || network.id}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-muted-foreground truncate font-mono text-xs">
                  {network.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyId(network.id)}
                  aria-label="Copiar ID da rede"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                  disabled={isBusy}
                >
                  <Copy className="size-3" />
                </button>
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={STATUS_VARIANT[network.status]}>
                {STATUS_LABEL[network.status]}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => handleLeave(network.id)}
              >
                {isLeaving ? 'Saindo...' : 'Sair'}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
