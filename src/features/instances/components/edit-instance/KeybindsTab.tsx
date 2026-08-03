import { TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { DiscardButton, SaveButton } from '@/components/common/SaveDiscardButtons'
import { SearchInput } from '@/components/common/SearchInput'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import {
  applyKeybinds,
  eventToMinecraftKey,
  findKeybindConflicts,
  humanizeKey,
  KEYBIND_CATEGORY_ORDER,
  parseKeybinds,
  type ParsedKeybind,
} from '@/lib/keybind-utils'
import { cn } from '@/lib/utils'

import { OptionsFileEmptyState } from './OptionsFileEmptyState'

interface KeybindsTabProps {
  instanceId: string
}

const OPTIONS_FILE = 'options.txt'

export function KeybindsTab({ instanceId }: KeybindsTabProps) {
  const [rawOptions, setRawOptions] = useState<string | null>(null)
  const [binds, setBinds] = useState<ParsedKeybind[]>([])
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [capturing, setCapturing] = useState<string | null>(null)

  useEffect(() => {
    InstanceWorkspaceAPI.readConfigFile(instanceId, OPTIONS_FILE)
      .then((content) => {
        setRawOptions(content)
        setBinds(parseKeybinds(content))
      })
      .catch(() => setRawOptions(null))
      .finally(() => setIsLoading(false))
  }, [instanceId])

  useEffect(() => {
    if (!capturing) return
    const handler = (event: KeyboardEvent) => {
      event.preventDefault()
      const key = eventToMinecraftKey(event)
      if (key) setOverrides((prev) => ({ ...prev, [capturing]: key }))
      setCapturing(null)
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [capturing])

  const isDirty = Object.keys(overrides).length > 0
  const conflicts = useMemo(() => findKeybindConflicts(binds, overrides), [binds, overrides])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return binds
    return binds.filter((b) => b.label.toLowerCase().includes(q) || b.action.toLowerCase().includes(q))
  }, [binds, search])
  const grouped = useMemo(() => {
    return KEYBIND_CATEGORY_ORDER.map((category) => ({
      category,
      items: filtered.filter((b) => b.category === category),
    })).filter((group) => group.items.length > 0)
  }, [filtered])

  const handleSave = async () => {
    if (rawOptions === null) return
    setIsSaving(true)
    try {
      const updated = applyKeybinds(rawOptions, overrides)
      await InstanceWorkspaceAPI.writeConfigFile(instanceId, OPTIONS_FILE, updated)
      setRawOptions(updated)
      setBinds(parseKeybinds(updated))
      setOverrides({})
      toast.success('Keybinds salvos')
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
          placeholder="Buscar controle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1.5">
          <DiscardButton onClick={() => setOverrides({})} disabled={!isDirty} />
          <SaveButton onClick={handleSave} disabled={!isDirty} isSaving={isSaving} />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {grouped.map(({ category, items }) => (
          <div key={category} className="flex flex-col gap-1.5">
            <h3 className="text-sm font-medium">{category}</h3>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {items.map((bind) => {
                const currentValue = overrides[bind.action] ?? bind.value
                const isOverridden = bind.action in overrides
                const conflictActions = conflicts.get(currentValue)
                const isConflicted = (conflictActions?.length ?? 0) > 1
                const otherActions = conflictActions?.filter((a) => a !== bind.action) ?? []
                return (
                  <div
                    key={bind.action}
                    className={cn(
                      'flex flex-col gap-1 rounded-lg border px-3 py-2',
                      isConflicted && 'border-destructive/50 bg-destructive/5',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm">{bind.label}</span>
                      <button
                        type="button"
                        onClick={() => setCapturing(bind.action)}
                        className={cn(
                          'shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium',
                          capturing === bind.action
                            ? 'border-primary bg-primary/10 text-primary'
                            : isConflicted
                              ? 'border-destructive/50 bg-destructive/10 text-destructive'
                              : isOverridden
                                ? 'border-primary/50 bg-primary/5'
                                : 'bg-muted/50 hover:bg-muted',
                        )}
                      >
                        {capturing === bind.action ? 'Pressione uma tecla...' : humanizeKey(currentValue)}
                      </button>
                    </div>
                    {isConflicted && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <TriangleAlert className="size-3 shrink-0" />
                        Conflita com {otherActions.map((a) => binds.find((b) => b.action === a)?.label ?? a).join(', ')}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
