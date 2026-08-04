import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsAPI } from '@/features/settings/services/settings.api'
import { useAppEnvConfig } from '@/lib/app-config'

export function SettingsPage() {
  const navigate = useNavigate()
  const env = useAppEnvConfig()
  const [apiKey, setApiKey] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('')
  const [mcstatApiKey, setMcstatApiKey] = useState('')
  const [savedMcstatApiKey, setSavedMcstatApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    SettingsAPI.get()
      .then((settings) => {
        setApiKey(settings.curseforgeApiKey ?? '')
        setSavedApiKey(settings.curseforgeApiKey ?? '')
        setMcstatApiKey(settings.mcstatApiKey ?? '')
        setSavedMcstatApiKey(settings.mcstatApiKey ?? '')
      })
      .catch((err) =>
        toast.error(`Falha ao carregar configurações: ${String(err)}`),
      )
      .finally(() => setIsLoading(false))
  }, [])

  const isDirty = apiKey !== savedApiKey || mcstatApiKey !== savedMcstatApiKey

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await SettingsAPI.update({
        curseforgeApiKey: apiKey.trim() || null,
        mcstatApiKey: mcstatApiKey.trim() || null,
      })
      setSavedApiKey(apiKey.trim())
      setSavedMcstatApiKey(mcstatApiKey.trim())
      toast.success('Configurações salvas')
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader title="Configurações" onBack={() => navigate('/')} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex max-w-xl flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>CurseForge</CardTitle>
              <CardDescription>
                Buscar mods e modpacks no CurseForge exige uma API key própria.
                Gere a sua em{' '}
                <a
                  href={env?.curseforgeConsole ?? ''}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  console.curseforge.com
                </a>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cf-api-key">API Key</Label>
                <Input
                  id="cf-api-key"
                  type="password"
                  placeholder="Cole sua API key aqui"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MCStat</CardTitle>
              <CardDescription>
                Buscar skins da comunidade no MCStat exige uma API key própria.
                Gere a sua em{' '}
                <a
                  href={env?.mcstatDocs ?? ''}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  mcstat.org/api-docs
                </a>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mcstat-api-key">API Key</Label>
                <Input
                  id="mcstat-api-key"
                  type="password"
                  placeholder="Cole sua API key aqui"
                  value={mcstatApiKey}
                  onChange={(e) => setMcstatApiKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button disabled={!isDirty || isSaving} onClick={handleSave}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
