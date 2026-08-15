import { useEffect, useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ZeroTierAPI } from '@/features/network/services/zerotier.api'
import type {
  CentralMemberDTO,
  CentralNetworkSummaryDTO,
} from '@/types/zerotier'

interface PendingMembersSectionProps {
  hasToken: boolean
  onOpenTokenDialog: () => void
  onInvalidToken?: () => void
}

export function PendingMembersSection({
  hasToken,
  onOpenTokenDialog,
  onInvalidToken,
}: PendingMembersSectionProps) {
  const [ownedNetworks, setOwnedNetworks] = useState<
    CentralNetworkSummaryDTO[]
  >([])
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    null,
  )
  const [pendingMembers, setPendingMembers] = useState<CentralMemberDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingNetworks, setIsLoadingNetworks] = useState(hasToken)
  const [approvingNodeId, setApprovingNodeId] = useState<string | null>(null)

  // Reset during render (not inside the fetch effects below) so the loading
  // state flips the instant the trigger changes, not after the effect runs.
  const [prevNetworkId, setPrevNetworkId] = useState(selectedNetworkId)
  if (prevNetworkId !== selectedNetworkId) {
    setPrevNetworkId(selectedNetworkId)
    if (selectedNetworkId) setIsLoading(true)
  }

  const [prevHasToken, setPrevHasToken] = useState(hasToken)
  if (prevHasToken !== hasToken) {
    setPrevHasToken(hasToken)
    setIsLoadingNetworks(hasToken)
  }

  useEffect(() => {
    if (!hasToken) return
    ZeroTierAPI.listOwnedNetworks()
      .then((networks) => {
        setOwnedNetworks(networks)
        setSelectedNetworkId((current) => current ?? networks[0]?.id ?? null)
      })
      .catch((err) => {
        toast.error(String(err))
        if (String(err).includes('inválido')) onInvalidToken?.()
      })
      .finally(() => setIsLoadingNetworks(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken])

  useEffect(() => {
    if (!selectedNetworkId) return
    ZeroTierAPI.listPendingMembers(selectedNetworkId)
      .then(setPendingMembers)
      .catch((err) => toast.error(String(err)))
      .finally(() => setIsLoading(false))
  }, [selectedNetworkId])

  const handleApprove = async (nodeId: string) => {
    if (!selectedNetworkId) return
    setApprovingNodeId(nodeId)
    try {
      await ZeroTierAPI.approveMember(selectedNetworkId, nodeId)
      setPendingMembers((members) => members.filter((m) => m.nodeId !== nodeId))
      toast.success('Membro aprovado.')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setApprovingNodeId(null)
    }
  }

  if (!hasToken) {
    return (
      <EmptyState
        title="Token não configurado"
        description="Adicione um token da API ZeroTier Central para aprovar quem pede entrada nas suas redes."
        className="py-6"
        action={
          <Button variant="outline" size="sm" onClick={onOpenTokenDialog}>
            Configurar token
          </Button>
        }
      />
    )
  }

  if (isLoadingNetworks) {
    return <CenteredSpinner className="py-6" />
  }

  if (ownedNetworks.length === 0) {
    return (
      <EmptyState
        title="Nenhuma rede sua encontrada"
        description="Crie uma rede em my.zerotier.com para gerenciá-la aqui."
        className="py-6"
      />
    )
  }

  const handleCopyId = async () => {
    if (!selectedNetworkId) return
    await navigator.clipboard.writeText(selectedNetworkId)
    toast.success('ID da rede copiado.')
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        value={selectedNetworkId ?? undefined}
        onValueChange={setSelectedNetworkId}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="Selecione uma rede" />
        </SelectTrigger>
        <SelectContent>
          {ownedNetworks.map((network) => (
            <SelectItem key={network.id} value={network.id}>
              {network.name || network.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedNetworkId && (
        <div className="flex items-center justify-between gap-2 rounded-md border p-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-muted-foreground text-xs">ID da rede:</span>
            <span className="truncate font-mono text-sm">
              {selectedNetworkId}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyId}
            aria-label="Copiar ID da rede"
          >
            <Copy />
            Copiar
          </Button>
        </div>
      )}

      {isLoading ? (
        <CenteredSpinner className="py-6" />
      ) : pendingMembers.length === 0 ? (
        <EmptyState title="Nenhuma solicitação pendente" className="py-6" />
      ) : (
        <div className="flex flex-col gap-2">
          {pendingMembers.map((member) => (
            <div
              key={member.nodeId}
              className="flex items-center justify-between gap-2 rounded-md border p-2"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {member.name || member.nodeId}
                </span>
                <span className="text-muted-foreground truncate font-mono text-xs">
                  {member.nodeId}
                </span>
              </div>
              <Button
                size="sm"
                disabled={approvingNodeId === member.nodeId}
                onClick={() => handleApprove(member.nodeId)}
              >
                {approvingNodeId === member.nodeId ? 'Aprovando...' : 'Aprovar'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
