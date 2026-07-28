import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { useVersions } from '@/features/instances/hooks/useVersions'
import { useInstanceStore } from '@/stores/instance.store'
import type { InstanceDTO } from '@/types/instance'

import { LoaderSelectionCard } from '../create-instance/LoaderSelectionCard'
import type { LoaderId } from '../create-instance/LoaderSelectionCard'

interface SettingsTabProps {
  instance: InstanceDTO
}

function toLoaderId(loader: string | null): LoaderId {
  return (loader as LoaderId | null) ?? 'vanilla'
}

export function SettingsTab({ instance }: SettingsTabProps) {
  const updateInstance = useInstanceStore((s) => s.updateInstance)
  const { versions } = useVersions()

  const [name, setName] = useState(instance.name)
  const [version, setVersion] = useState(instance.version)
  const [loader, setLoader] = useState<LoaderId>(toLoaderId(instance.loader))
  const [minMemory, setMinMemory] = useState(instance.minMemory)
  const [maxMemory, setMaxMemory] = useState(instance.maxMemory)
  const [javaArgs, setJavaArgs] = useState(instance.javaArgs ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const releaseVersions = useMemo(() => {
    const list = versions.filter((v) => v.type === 'release')
    if (!list.some((v) => v.id === version)) {
      const current = versions.find((v) => v.id === version)
      if (current) list.unshift(current)
    }
    return list
  }, [versions, version])

  const isDirty =
    name !== instance.name ||
    version !== instance.version ||
    loader !== toLoaderId(instance.loader) ||
    minMemory !== instance.minMemory ||
    maxMemory !== instance.maxMemory ||
    javaArgs !== (instance.javaArgs ?? '')

  const handleSave = async () => {
    if (!name.trim()) return
    setIsSaving(true)
    try {
      await updateInstance({
        id: instance.id,
        name: name.trim(),
        version,
        loader: loader === 'vanilla' ? null : loader,
        loaderVersion: null,
        javaArgs: javaArgs.trim() || null,
        minMemory,
        maxMemory,
      })
      toast.success('Instância atualizada')
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nome da Instância</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-version">Versão</Label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger id="edit-version" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {releaseVersions.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <LoaderSelectionCard selected={loader} onSelect={setLoader} />

      <Card>
        <CardHeader>
          <CardTitle>Memória</CardTitle>
          <CardDescription>Quantidade de RAM alocada para a JVM ao iniciar esta instância.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Mínima</Label>
              <span className="text-muted-foreground">{minMemory} MB</span>
            </div>
            <Slider
              value={[minMemory]}
              min={512}
              max={maxMemory}
              step={256}
              onValueChange={([v]) => setMinMemory(v)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Máxima</Label>
              <span className="text-muted-foreground">{maxMemory} MB</span>
            </div>
            <Slider
              value={[maxMemory]}
              min={minMemory}
              max={16384}
              step={256}
              onValueChange={([v]) => setMaxMemory(v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Argumentos da JVM</CardTitle>
          <CardDescription>Argumentos Java adicionais, opcional (ex: -XX:+UseG1GC).</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={javaArgs} onChange={(e) => setJavaArgs(e.target.value)} rows={3} placeholder="Nenhum" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button disabled={!isDirty || isSaving} onClick={handleSave}>
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  )
}
