import { SingleFieldDialog } from '@/components/common/SingleFieldDialog'
import { useAppEnvConfig } from '@/lib/app-config'

interface McstatApiKeyDialogProps {
  open: boolean
  currentKey: string
  invalidKey?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (key: string) => Promise<void>
}

export function McstatApiKeyDialog({
  open,
  currentKey,
  invalidKey,
  onOpenChange,
  onSubmit,
}: McstatApiKeyDialogProps) {
  const env = useAppEnvConfig()

  return (
    <SingleFieldDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Chave de API do MCStat"
      description={
        <>
          {invalidKey && (
            <p className="text-destructive mb-2 font-medium">
              Chave inválida, expirada ou revogada. Gere uma nova e cole abaixo.
            </p>
          )}
          Buscar skins no MCStat exige uma API key própria, ela não vem embutida
          no launcher. Gere a sua em{' '}
          <a
            href={env?.mcstatDashboard ?? ''}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            mcstat.org/dashboard/api-keys
          </a>
          .
        </>
      }
      fieldId="mcstat-api-key"
      fieldLabel="API Key"
      placeholder="mcs_..."
      inputType="password"
      initialValue={currentKey}
      submitLabel="Salvar"
      submitLoadingLabel="Verificando..."
      onSubmit={onSubmit}
    />
  )
}
