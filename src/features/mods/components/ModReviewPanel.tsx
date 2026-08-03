import { ArrowLeft, Check, Loader2, Puzzle, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { ProgressGroup } from '@/components/common/ProgressGroup'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModAPI } from '@/features/mods/services/mod.api'
import type { ContentKind, ModSearchResult, ModVersion } from '@/types/mods'

export interface ReviewEntry {
  key: string
  result: ModSearchResult
  version: ModVersion
  isDependency: boolean
}

type EntryStatus = 'pending' | 'installing' | 'done' | 'failed'

interface ModReviewPanelProps {
  instanceId: string
  selection: Record<string, { result: ModSearchResult; version: ModVersion }>
  gameVersion?: string
  loader?: string | null
  kind: ContentKind
  onBack: () => void
  onInstalled: () => void
}

export function ModReviewPanel({ instanceId, selection, gameVersion, loader, kind, onBack, onInstalled }: ModReviewPanelProps) {
  const [entries, setEntries] = useState<ReviewEntry[]>([])
  const [isResolving, setIsResolving] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, EntryStatus>>({})
  const [installedCount, setInstalledCount] = useState(0)
  const [currentName, setCurrentName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      const resolved = new Map<string, ReviewEntry>()
      for (const [key, entry] of Object.entries(selection)) {
        resolved.set(key, { key, result: entry.result, version: entry.version, isDependency: false })
      }

      // Only Modrinth versions carry dependency info from the backend today.
      let queue = Object.values(selection).filter((e) => e.result.source === 'modrinth')
      let guard = 0
      while (queue.length > 0 && guard < 5) {
        guard += 1
        const nextQueue: typeof queue = []
        for (const entry of queue) {
          for (const depId of entry.version.requiredDependencyProjectIds) {
            const depKey = `modrinth:${depId}`
            if (resolved.has(depKey)) continue
            try {
              const [project, versions] = await Promise.all([
                ModAPI.getProject('modrinth', depId),
                ModAPI.getVersions({ source: 'modrinth', projectId: depId, gameVersion, loader }),
              ])
              const version = versions[0]
              if (!version) continue
              const result: ModSearchResult = {
                source: 'modrinth',
                projectId: depId,
                name: project.name,
                description: project.description,
                iconUrl: project.iconUrl,
                downloads: project.downloads,
                author: '',
                loader: loader ?? null,
                gameVersion: gameVersion ?? null,
              }
              resolved.set(depKey, { key: depKey, result, version, isDependency: true })
              nextQueue.push({ result, version })
            } catch {
              // dependency lookup failing shouldn't block the rest of the install
            }
          }
        }
        queue = nextQueue
      }

      if (!cancelled) {
        setEntries([...resolved.values()])
        setIsResolving(false)
      }
    }

    resolve()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const removeEntry = (key: string) => setEntries((prev) => prev.filter((e) => e.key !== key))

  const handleInstallAll = async () => {
    setIsInstalling(true)
    setInstalledCount(0)
    let failures = 0

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      setCurrentName(entry.result.name)
      setStatuses((prev) => ({ ...prev, [entry.key]: 'installing' }))

      if (!entry.version.downloadUrl) {
        failures += 1
        setStatuses((prev) => ({ ...prev, [entry.key]: 'failed' }))
        setInstalledCount(i + 1)
        continue
      }

      try {
        await ModAPI.install({
          instanceId,
          source: entry.result.source,
          projectId: entry.result.projectId,
          modName: entry.result.name,
          versionName: entry.version.name,
          fileName: entry.version.fileName,
          downloadUrl: entry.version.downloadUrl,
          iconUrl: entry.result.iconUrl,
          kind,
        })
        setStatuses((prev) => ({ ...prev, [entry.key]: 'done' }))
      } catch (err) {
        failures += 1
        setStatuses((prev) => ({ ...prev, [entry.key]: 'failed' }))
        toast.error(`Falha ao instalar ${entry.result.name}: ${String(err)}`)
      }
      setInstalledCount(i + 1)
    }

    setCurrentName(null)
    setIsInstalling(false)

    if (failures === 0) {
      toast.success(`${entries.length} mod(s) instalado(s)`)
    } else {
      toast.warning(`${entries.length - failures} instalado(s), ${failures} falharam`)
    }
    onInstalled()
  }

  const overallPercent = entries.length > 0 ? (installedCount / entries.length) * 100 : 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b p-3">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isInstalling}>
          <ArrowLeft /> Voltar
        </Button>
        <span className="font-medium">Revisar e Instalar</span>
      </div>

      <ScrollArea type="always" className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {isResolving && (
            <p className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Resolvendo dependências...
            </p>
          )}
          {!isResolving && entries.length === 0 && <EmptyState icon={Puzzle} title="Nenhum mod selecionado." />}
          {entries.map((entry) => {
            const status = statuses[entry.key]
            return (
              <div key={entry.key} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                <EntityAvatar name={entry.result.name} iconUrl={entry.result.iconUrl} className="size-9" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{entry.result.name}</p>
                    {entry.isDependency && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        dependência
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{entry.version.name}</p>
                </div>
                {status === 'installing' && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
                {status === 'done' && <Check className="size-4 shrink-0 text-primary" />}
                {status === 'failed' && <X className="size-4 shrink-0 text-destructive" />}
                {!status && (
                  <Button variant="ghost" size="icon-sm" onClick={() => removeEntry(entry.key)} disabled={isInstalling}>
                    <X />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-3 border-t p-3">
        {isInstalling && (
          <div className="flex flex-col gap-2">
            <ProgressGroup label="Progresso geral" value={overallPercent} rightLabel={`${installedCount}/${entries.length}`} />
            <div className="flex flex-col gap-1">
              <p className="truncate text-xs font-medium">{currentName}</p>
              <Progress value={undefined} className="animate-pulse" />
            </div>
          </div>
        )}

        <Button className="w-full" disabled={isResolving || entries.length === 0 || isInstalling} onClick={handleInstallAll}>
          {isInstalling ? <Loader2 className="animate-spin" /> : `Instalar Tudo (${entries.length})`}
        </Button>
      </div>
    </div>
  )
}
