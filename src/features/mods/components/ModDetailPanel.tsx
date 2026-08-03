import { BookOpen, Check, Code2, ExternalLink, MessageCircle, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { MarkdownBody } from '@/components/common/MarkdownBody'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ModAPI } from '@/features/mods/services/mod.api'
import { useLinkPreviewStore } from '@/stores/link-preview.store'
import type { ModProject, ModSearchResult, ModVersion } from '@/types/mods'

interface ModDetailPanelProps {
  result: ModSearchResult
  gameVersion?: string
  loader?: string | null
  isSelected: boolean
  onToggleSelect: (version: ModVersion) => void
}

export function ModDetailPanel({ result, gameVersion, loader, isSelected, onToggleSelect }: ModDetailPanelProps) {
  const [project, setProject] = useState<ModProject | null>(null)
  const [versions, setVersions] = useState<ModVersion[]>([])
  const [versionId, setVersionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const openLink = useLinkPreviewStore((s) => s.open)

  // Reset the panel during render whenever another mod is selected (the effect
  // below only performs the fetch, so setState stays out of effects).
  const detailKey = `${result.source}:${result.projectId}`
  const [prevDetailKey, setPrevDetailKey] = useState(detailKey)
  if (prevDetailKey !== detailKey) {
    setPrevDetailKey(detailKey)
    setIsLoading(true)
    setProject(null)
    setVersions([])
    setVersionId(null)
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([
      ModAPI.getProject(result.source, result.projectId),
      ModAPI.getVersions({ source: result.source, projectId: result.projectId, gameVersion, loader }),
    ])
      .then(([proj, vers]) => {
        if (cancelled) return
        setProject(proj)
        setVersions(vers)
        setVersionId(vers[0]?.id ?? null)
      })
      .catch((err) => !cancelled && toast.error(`Falha ao carregar detalhes: ${String(err)}`))
      .finally(() => !cancelled && setIsLoading(false))

    return () => {
      cancelled = true
    }
  }, [result, gameVersion, loader])

  const selectedVersion = versions.find((v) => v.id === versionId) ?? null

  if (isLoading) {
    return <CenteredSpinner className="h-full" />
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-start gap-3">
          <EntityAvatar name={result.name} iconUrl={result.iconUrl} className="size-14 rounded-lg" fallbackClassName="rounded-lg" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{result.name}</h3>
            <p className="text-sm text-muted-foreground">por {result.author || 'desconhecido'}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{project?.description ?? result.description}</p>

        {project && (project.sourceUrl || project.issuesUrl || project.wikiUrl || project.discordUrl) && (
          <div className="flex flex-col gap-1.5 border-t pt-3 text-sm">
            {project.sourceUrl && (
              <a href={project.sourceUrl} onClick={(e) => (e.preventDefault(), openLink(project.sourceUrl!))} className="flex items-center gap-2 hover:underline">
                <Code2 className="size-4" /> Repositório
              </a>
            )}
            {project.wikiUrl && (
              <a href={project.wikiUrl} onClick={(e) => (e.preventDefault(), openLink(project.wikiUrl!))} className="flex items-center gap-2 hover:underline">
                <BookOpen className="size-4" /> Wiki / Documentação
              </a>
            )}
            {project.issuesUrl && (
              <a href={project.issuesUrl} onClick={(e) => (e.preventDefault(), openLink(project.issuesUrl!))} className="flex items-center gap-2 hover:underline">
                <ExternalLink className="size-4" /> Issues
              </a>
            )}
            {project.discordUrl && (
              <a href={project.discordUrl} onClick={(e) => (e.preventDefault(), openLink(project.discordUrl!))} className="flex items-center gap-2 hover:underline">
                <MessageCircle className="size-4" /> Discord
              </a>
            )}
          </div>
        )}

        {project?.body && <MarkdownBody className="prose prose-sm dark:prose-invert max-w-none border-t pt-3 break-words">{project.body}</MarkdownBody>}
      </div>

      <div className="flex flex-col gap-2 border-t p-4">
        <Select value={versionId ?? undefined} onValueChange={setVersionId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma versão" />
          </SelectTrigger>
          <SelectContent>
            {versions.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={isSelected ? 'outline' : 'default'}
          disabled={!isSelected && !selectedVersion}
          onClick={() => selectedVersion && onToggleSelect(selectedVersion)}
        >
          {isSelected ? (
            <>
              <Check /> Desmarcar mod para download
            </>
          ) : (
            <>
              <Plus /> Selecionar mod para download
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
