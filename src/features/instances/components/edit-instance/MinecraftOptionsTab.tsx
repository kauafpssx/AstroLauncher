import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import {
  DiscardButton,
  SaveButton,
} from '@/components/common/SaveDiscardButtons'
import { SearchInput } from '@/components/common/SearchInput'
import { InstanceAPI } from '@/features/instances/services/instance.api'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import {
  applyMinecraftOptionUpdates,
  OPTION_CATEGORY_ORDER,
  parseMinecraftOptions,
  toRawValue,
  type ParsedOption,
} from '@/lib/minecraft-options'

import { MinecraftOptionField } from './MinecraftOptionField'
import { OptionsFileEmptyState } from './OptionsFileEmptyState'

interface MinecraftOptionsTabProps {
  instanceId: string
}

const OPTIONS_FILE = 'options.txt'

export function MinecraftOptionsTab({ instanceId }: MinecraftOptionsTabProps) {
  const [rawOptions, setRawOptions] = useState<string | null>(null)
  const [options, setOptions] = useState<ParsedOption[]>([])
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [audioDevices, setAudioDevices] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    InstanceWorkspaceAPI.readConfigFile(instanceId, OPTIONS_FILE)
      .then((content) => {
        setRawOptions(content)
        setOptions(parseMinecraftOptions(content))
      })
      .catch(() => setRawOptions(null))
      .finally(() => setIsLoading(false))
  }, [instanceId])

  useEffect(() => {
    InstanceAPI.listAudioOutputDevices()
      .then(setAudioDevices)
      .catch(() => setAudioDevices([]))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) || o.key.toLowerCase().includes(q),
    )
  }, [options, search])

  const grouped = useMemo(() => {
    return OPTION_CATEGORY_ORDER.map((category) => ({
      category,
      items: filtered.filter((o) => o.category === category),
    })).filter((group) => group.items.length > 0)
  }, [filtered])

  const isDirty = Object.keys(overrides).length > 0

  const setOverride = (key: string, value: string) =>
    setOverrides((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (rawOptions === null) return
    setIsSaving(true)
    try {
      const updates: Record<string, string> = {}
      for (const option of options) {
        if (option.key in overrides) {
          updates[option.key] = toRawValue(
            overrides[option.key],
            option.rawValue,
            option.type,
          )
        }
      }
      const updated = applyMinecraftOptionUpdates(rawOptions, updates)
      await InstanceWorkspaceAPI.writeConfigFile(
        instanceId,
        OPTIONS_FILE,
        updated,
      )
      setRawOptions(updated)
      setOptions(parseMinecraftOptions(updated))
      setOverrides({})
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <CenteredSpinner className="h-64" />

  if (rawOptions === null) return <OptionsFileEmptyState />

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <SearchInput
          containerClassName="max-w-xs flex-1"
          placeholder="Buscar opção..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1.5">
          <DiscardButton onClick={() => setOverrides({})} disabled={!isDirty} />
          <SaveButton
            onClick={handleSave}
            disabled={!isDirty}
            isSaving={isSaving}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {grouped.map(({ category, items }) => (
          <div key={category} className="flex flex-col gap-1.5">
            <h3 className="text-sm font-medium">{category}</h3>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {items.map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <span className="truncate text-sm">{option.label}</span>
                  <MinecraftOptionField
                    option={option}
                    value={overrides[option.key] ?? option.editableValue}
                    onChange={(v) => setOverride(option.key, v)}
                    audioDevices={audioDevices}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nenhuma opção encontrada.
          </p>
        )}
      </div>
    </div>
  )
}
