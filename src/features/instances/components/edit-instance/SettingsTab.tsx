import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useInstanceStore } from '@/stores/instance.store'
import type { InstanceDTO } from '@/types/instance'

import { ModAPI } from '@/features/mods/services/mod.api'
import type { SuggestedMemoryDTO } from '@/types/instance'

import { IconPickerButton } from '../IconPickerButton'
import { LoaderSelectionCard } from '../create-instance/LoaderSelectionCard'
import { InstanceAPI } from '../../services/instance.api'
import { MemorySettingsSection } from './MemorySettingsSection'
import {
  FALLBACK_TOTAL_MEMORY_MB,
  MIN_MEMORY_MB,
  toLoaderId,
} from './settings-tab-utils'

interface SettingsTabProps {
  instance: InstanceDTO
}

export function SettingsTab({ instance }: SettingsTabProps) {
  const updateInstance = useInstanceStore((s) => s.updateInstance)

  const [name, setName] = useState(instance.name)
  const version = instance.version
  const [iconPath, setIconPath] = useState(instance.iconPath)
  const loader = toLoaderId(instance.loader)
  const [minMemory, setMinMemory] = useState(instance.minMemory)
  const [maxMemory, setMaxMemory] = useState(instance.maxMemory)
  const [javaArgs, setJavaArgs] = useState(instance.javaArgs ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [totalMemoryMb, setTotalMemoryMb] = useState(FALLBACK_TOTAL_MEMORY_MB)
  const [suggestedMemory, setSuggestedMemory] =
    useState<SuggestedMemoryDTO | null>(null)

  useEffect(() => {
    InstanceAPI.getTotalSystemMemoryMb()
      .then(setTotalMemoryMb)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    ModAPI.getSuggestedMemory(instance.id)
      .then((suggestion) => {
        if (!cancelled) setSuggestedMemory(suggestion)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [instance.id])

  const updateMinMemory = (value: number) => {
    const clamped = Math.min(Math.max(value, MIN_MEMORY_MB), totalMemoryMb)
    setMinMemory(clamped)
    if (clamped > maxMemory) setMaxMemory(clamped)
  }

  const updateMaxMemory = (value: number) => {
    const clamped = Math.max(Math.min(value, totalMemoryMb), MIN_MEMORY_MB)
    setMaxMemory(clamped)
    if (clamped < minMemory) setMinMemory(clamped)
  }

  const isDirty =
    name !== instance.name ||
    iconPath !== instance.iconPath ||
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
        loaderVersion: instance.loaderVersion,
        javaArgs: javaArgs.trim() || null,
        minMemory,
        maxMemory,
        iconPath,
      })
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Informações</h3>
        <div className="flex items-stretch gap-4">
          <IconPickerButton
            iconPath={iconPath}
            onSelect={setIconPath}
            className="w-28 shrink-0 self-stretch overflow-hidden"
            rounded="rounded-xl"
            fallbackIconClassName="size-10"
          />

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Nome da Instância</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                Versão
                <Lock className="text-muted-foreground size-3" />
              </Label>
              <div className="bg-muted text-muted-foreground flex h-9 items-center rounded-md border px-3 text-sm">
                {version}
              </div>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Não é possível alterar a versão de uma instância existente. Crie uma
          nova instância para usar outra versão.
        </p>
      </div>

      <LoaderSelectionCard selected={loader} onSelect={() => {}} disabled />

      <MemorySettingsSection
        minMemory={minMemory}
        maxMemory={maxMemory}
        totalMemoryMb={totalMemoryMb}
        suggestedMemory={suggestedMemory}
        onMinChange={updateMinMemory}
        onMaxChange={updateMaxMemory}
        onUseSuggested={() => {
          if (!suggestedMemory) return
          updateMinMemory(suggestedMemory.minMb)
          updateMaxMemory(suggestedMemory.maxMb)
        }}
      />

      <div className="flex flex-col gap-2 border-t pt-4">
        <div>
          <h3 className="text-sm font-medium">Argumentos da JVM</h3>
          <p className="text-muted-foreground text-xs">
            Argumentos Java adicionais, opcional (ex: -XX:+UseG1GC).
          </p>
        </div>
        <Textarea
          value={javaArgs}
          onChange={(e) => setJavaArgs(e.target.value)}
          rows={3}
          placeholder="Nenhum"
        />
      </div>

      <div className="flex justify-end">
        <Button disabled={!isDirty || isSaving} onClick={handleSave}>
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  )
}
