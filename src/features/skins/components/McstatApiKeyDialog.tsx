import { toast } from 'sonner'

import { SingleFieldDialog } from '@/components/common/SingleFieldDialog'
import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useAppEnvConfig } from '@/lib/app-config'

interface McstatApiKeyDialogProps {
  open: boolean
  currentKey: string
  onOpenChange: (open: boolean) => void
  onSaved: (key: string) => void
}

export function McstatApiKeyDialog({
  open,
  currentKey,
  onOpenChange,
  onSaved,
}: McstatApiKeyDialogProps) {
  const env = useAppEnvConfig()

  return (
    <SingleFieldDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Chave de API do MCStat"
      description={
        <>
          Buscar skins no MCStat exige uma API key própria — ela não vem
          embutida no launcher. Gere a sua em{' '}
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
      submitLoadingLabel="Salvando..."
      onSubmit={async (key) => {
        try {
          const settings = await SettingsAPI.get()
          await SettingsAPI.update({
            curseforgeApiKey: settings.curseforgeApiKey,
            mcstatApiKey: key,
          })
          toast.success('Chave do MCStat salva')
          onSaved(key)
        } catch (err) {
          toast.error(`Falha ao salvar chave: ${String(err)}`)
          throw err
        }
      }}
    />
  )
}
