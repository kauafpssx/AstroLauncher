import { SingleFieldDialog } from '@/components/common/SingleFieldDialog'
import { useAppEnvConfig } from '@/lib/app-config'
import { MAX, zerotierApiTokenSchema } from '@/lib/validation'

interface ZeroTierTokenDialogProps {
  open: boolean
  currentToken: string
  invalidToken?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (token: string) => Promise<void>
}

export function ZeroTierTokenDialog({
  open,
  currentToken,
  invalidToken,
  onOpenChange,
  onSubmit,
}: ZeroTierTokenDialogProps) {
  const env = useAppEnvConfig()

  return (
    <SingleFieldDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Token da API ZeroTier Central"
      description={
        <>
          {invalidToken && (
            <p className="text-destructive mb-2 font-medium">
              Token inválido ou expirado. Gere um novo e cole abaixo.
            </p>
          )}
          Para aprovar quem pede entrada nas suas redes, gere um token pessoal
          em{' '}
          <a
            href={env?.zerotierAccount ?? ''}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            my.zerotier.com/account
          </a>
          .
        </>
      }
      fieldId="zerotier-api-token"
      fieldLabel="Token"
      placeholder="token da API"
      inputType="password"
      maxLength={MAX.ZEROTIER_API_TOKEN}
      schema={zerotierApiTokenSchema}
      initialValue={currentToken}
      submitLabel="Salvar"
      submitLoadingLabel="Salvando..."
      showCancel
      onSubmit={onSubmit}
    />
  )
}
