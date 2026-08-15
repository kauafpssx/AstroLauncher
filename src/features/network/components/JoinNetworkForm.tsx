import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getFirstIssue, MAX, zerotierNetworkIdSchema } from '@/lib/validation'

interface JoinNetworkFormProps {
  joinedNetworkIds: string[]
  disabled?: boolean
  onJoin: (networkId: string) => Promise<void>
}

export function JoinNetworkForm({
  joinedNetworkIds,
  disabled,
  onJoin,
}: JoinNetworkFormProps) {
  const [networkId, setNetworkId] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async () => {
    const trimmed = networkId.trim()
    const issue = getFirstIssue(zerotierNetworkIdSchema, trimmed)
    if (issue) {
      toast.error(issue)
      return
    }
    if (joinedNetworkIds.includes(trimmed)) {
      toast.error('Você já está nessa rede.')
      return
    }
    setIsJoining(true)
    try {
      await onJoin(trimmed)
      setNetworkId('')
      toast.success('Solicitação enviada. Aguarde a aprovação do dono da rede.')
    } catch (err) {
      toast.error(String(err))
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="zerotier-network-id">ID da rede ZeroTier</Label>
      <div className="flex gap-2">
        <Input
          id="zerotier-network-id"
          placeholder="8056c2e21c000001"
          maxLength={MAX.ZEROTIER_NETWORK_ID}
          value={networkId}
          disabled={disabled}
          onChange={(e) => setNetworkId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleJoin()
          }}
        />
        <Button
          onClick={handleJoin}
          disabled={!networkId.trim() || isJoining || disabled}
        >
          {isJoining ? 'Entrando...' : 'Entrar'}
        </Button>
      </div>
    </div>
  )
}
