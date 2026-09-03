import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CharacterCounter } from '@/components/common/CharacterCounter'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX,
  getFirstIssue,
  instanceNameSchema,
  javaArgsSchema,
} from '@/lib/validation'
import { getCached } from '@/lib/sessionCache'
import { useInstanceStore } from '@/stores/instance.store'
import type { InstanceDTO } from '@/types/instance'
import type { SuggestedMemoryDTO } from '@/types/instance'
import { LoaderSelectionCard } from '@/features/instances/components/create-instance/custom/LoaderSelectionCard'
import { InstanceAPI } from '@/features/instances/services/instance.api'
import { InstanceInfoSection } from './InstanceInfoSection'
import { InstanceStatsSection } from './InstanceStatsSection'
import { JavaSettingsSection } from './JavaSettingsSection'
import { MemorySettingsSection } from './MemorySettingsSection'
import {
  FALLBACK_TOTAL_MEMORY_MB,
  MIN_MEMORY_MB,
  toLoaderId,
} from './settings-tab-utils'
import { WindowSettingsSection } from './WindowSettingsSection'
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
  const [fullscreen, setFullscreen] = useState(instance.fullscreen)
  const [windowWidth, setWindowWidth] = useState(instance.windowWidth)
  const [windowHeight, setWindowHeight] = useState(instance.windowHeight)
  const [javaPath, setJavaPath] = useState(instance.javaPath)
  const [windowMonitor, setWindowMonitor] = useState(instance.windowMonitor)
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
    getCached(`suggested-memory:${instance.id}`, () =>
      InstanceAPI.getSuggestedMemory(instance.id),
    )
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
    javaArgs !== (instance.javaArgs ?? '') ||
    fullscreen !== instance.fullscreen ||
    windowWidth !== instance.windowWidth ||
    windowHeight !== instance.windowHeight ||
    javaPath !== instance.javaPath ||
    windowMonitor !== instance.windowMonitor
  const handleSave = async () => {
    const issue = getFirstIssue(instanceNameSchema, name)
    if (issue) {
      toast.error(issue)
      return
    }
    const argsIssue = getFirstIssue(javaArgsSchema, javaArgs)
    if (argsIssue) {
      toast.error(argsIssue)
      return
    }
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
        fullscreen,
        windowWidth,
        windowHeight,
        javaPath,
        windowMonitor,
      })
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <div className="flex flex-col gap-6">
      <InstanceInfoSection
        name={name}
        version={version}
        iconPath={iconPath}
        onNameChange={setName}
        onIconChange={setIconPath}
      />

      <LoaderSelectionCard selected={loader} onSelect={() => {}} disabled />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <InstanceStatsSection instance={instance} />
        <WindowSettingsSection
          fullscreen={fullscreen}
          windowWidth={windowWidth}
          windowHeight={windowHeight}
          windowMonitor={windowMonitor}
          onFullscreenChange={setFullscreen}
          onWindowWidthChange={setWindowWidth}
          onWindowHeightChange={setWindowHeight}
          onWindowMonitorChange={setWindowMonitor}
        />
        <JavaSettingsSection
          instanceId={instance.id}
          javaPath={javaPath}
          onJavaPathChange={setJavaPath}
        />
      </div>

      <MemorySettingsSection
        minMemory={minMemory}
        maxMemory={maxMemory}
        totalMemoryMb={totalMemoryMb}
        suggestedMemory={suggestedMemory}
        onMinChange={updateMinMemory}
        onMaxChange={updateMaxMemory}
        onUseSuggested={() => {
          if (!suggestedMemory) return
          const min = Math.min(
            Math.max(suggestedMemory.minMb, MIN_MEMORY_MB),
            totalMemoryMb,
          )
          const max = Math.min(
            Math.max(suggestedMemory.maxMb, MIN_MEMORY_MB),
            totalMemoryMb,
          )
          setMinMemory(Math.min(min, max))
          setMaxMemory(Math.max(min, max))
        }}
      />

      <div className="flex flex-col gap-2">
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
          maxLength={MAX.JAVA_ARGS}
          placeholder="Nenhum"
        />
        <CharacterCounter
          value={javaArgs}
          max={MAX.JAVA_ARGS}
          className="self-end"
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
