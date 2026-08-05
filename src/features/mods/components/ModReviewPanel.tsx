import { ArrowLeft, Loader2, Puzzle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ProgressGroup } from '@/components/common/ProgressGroup'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModAPI } from '@/features/mods/services/mod.api'
import { tooltipProps } from '@/lib/tooltip'
import type { ContentKind, ModSearchResult, ModVersion } from '@/types/mods'

import type { EntryStatus } from './mod-review.types'
import { ModReviewRow } from './ModReviewRow'
import { useReviewEntries } from './useReviewEntries'

interface ModReviewPanelProps {
  instanceId: string
  selection: Record<string, { result: ModSearchResult; version: ModVersion }>
  gameVersion?: string
  loader?: string | null
  kind: ContentKind
  /** `source:modId` keys already installed in this instance. */
  installedKeys: Set<string>
  /** Lowercased jar filenames already installed in this instance. */
  installedFileNames: Set<string>
  onBack: () => void
  onInstalled: () => void
}

export function ModReviewPanel({
  instanceId,
  selection,
  gameVersion,
  loader,
  kind,
  installedKeys,
  installedFileNames,
  onBack,
  onInstalled,
}: ModReviewPanelProps) {
  const { entries, setEntries, isResolving } = useReviewEntries({
    selection,
    gameVersion,
    loader,
    installedKeys,
    installedFileNames,
  })
  const [isInstalling, setIsInstalling] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, EntryStatus>>({})
  const [installedCount, setInstalledCount] = useState(0)
  const [currentName, setCurrentName] = useState<string | null>(null)

  const removeEntry = (key: string) =>
    setEntries((prev) => prev.filter((e) => e.key !== key))

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

    if (failures > 0) {
      toast.error(
        `${entries.length - failures} instalado(s), ${failures} falharam`,
      )
    }
    onInstalled()
  }

  const overallPercent =
    entries.length > 0 ? (installedCount / entries.length) * 100 : 0

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex h-14 shrink-0 items-center gap-2 border-b px-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isInstalling}
          {...tooltipProps('Voltar')}
        >
          <ArrowLeft />
        </Button>
        <span className="pointer-events-none absolute inset-x-0 text-center text-sm font-medium">
          Revisar e Instalar
        </span>
      </div>

      <ScrollArea type="always" className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {isResolving && (
            <p className="text-muted-foreground flex items-center justify-center gap-2 p-6 text-sm">
              <Loader2 className="size-4 animate-spin" /> Resolvendo
              dependências...
            </p>
          )}
          {!isResolving && entries.length === 0 && (
            <EmptyState icon={Puzzle} title="Nenhum mod selecionado." />
          )}
          {entries.map((entry) => (
            <ModReviewRow
              key={entry.key}
              entry={entry}
              status={statuses[entry.key]}
              isInstalling={isInstalling}
              onRemove={removeEntry}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="flex flex-col gap-3 border-t p-3">
        {isInstalling && (
          <div className="flex flex-col gap-2">
            <ProgressGroup
              label="Progresso geral"
              value={overallPercent}
              rightLabel={`${installedCount}/${entries.length}`}
            />
            <div className="flex flex-col gap-1">
              <p className="truncate text-xs font-medium">{currentName}</p>
              <Progress value={undefined} className="animate-pulse" />
            </div>
          </div>
        )}

        <Button
          className="w-full"
          disabled={isResolving || entries.length === 0 || isInstalling}
          onClick={handleInstallAll}
        >
          {isInstalling ? (
            <Loader2 className="animate-spin" />
          ) : (
            `Instalar Tudo (${entries.length})`
          )}
        </Button>
      </div>
    </div>
  )
}
