import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SettingsAPI } from '@/features/settings/services/settings.api'

export function SettingsPage() {
  const navigate = useNavigate()
  const [apiKey, setApiKey] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    SettingsAPI.get()
      .then((settings) => {
        setApiKey(settings.curseforgeApiKey ?? '')
        setSavedApiKey(settings.curseforgeApiKey ?? '')
      })
      .catch((err) => toast.error(`Falha ao carregar configurações: ${String(err)}`))
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await SettingsAPI.update({ curseforgeApiKey: apiKey.trim() || null })
      setSavedApiKey(apiKey.trim())
      toast.success('Configurações salvas')
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft />
        </Button>
        <span className="font-medium">Configurações</span>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>CurseForge</CardTitle>
            <CardDescription>
              Buscar mods e modpacks no CurseForge exige uma API key própria. Gere a sua em{' '}
              <a
                href="https://console.curseforge.com/"
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
            <div className="flex justify-end">
              <Button disabled={apiKey === savedApiKey || isSaving} onClick={handleSave}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
