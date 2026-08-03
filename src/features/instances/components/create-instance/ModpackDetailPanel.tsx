import { listen } from '@tauri-apps/api/event'
import { BookOpen, Check, Code2, Download, ExternalLink, Loader2, MessageCircle, Play, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { MarkdownBody } from '@/components/common/MarkdownBody'
import { ProgressGroup } from '@/components/common/ProgressGroup'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModAPI } from '@/features/mods/services/mod.api'
import type { AstroPackEvent } from '@/features/instances/services/astropack.api'
import type { ModProject, ModSearchResult, ModSource, ModVersion } from '@/types/mods'
import { useLinkPreviewStore } from '@/stores/link-preview.store'
import { useLaunchStore } from '@/stores/launch.store'
import { useModpackInstallStore } from '@/stores/modpack-install.store'
import { useInstanceStore } from '@/stores/instance.store'

const LOADER_ICON: Record<string, string> = {
  fabric: '/providers/fabricmc.svg',
  quilt: '/providers/quiltmc.svg',
  forge: '/providers/forge.png',
  neoforge: '/providers/neoforged.svg',
}

const LOADER_LABEL: Record<string, string> = {
  fabric: 'Fabric',
  quilt: 'Quilt',
  forge: 'Forge',
  neoforge: 'NeoForge',
}

interface ModpackDetailPanelProps {
  result: ModSearchResult
  source: ModSource
}

export function ModpackDetailPanel({ result, source }: ModpackDetailPanelProps) {
  const navigate = useNavigate()
  const [project, setProject] = useState<ModProject | null>(null)
  const [versions, setVersions] = useState<ModVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<ModVersion | null>(null)
  const [instanceName, setInstanceName] = useState(result.name)
  const [isLoading, setIsLoading] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installedFiles, setInstalledFiles] = useState<{ name: string; iconUrl: string | null }[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [isDone, setIsDone] = useState(false)
  const [installedInstanceId, setInstalledInstanceId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const openLink = useLinkPreviewStore((s) => s.open)
  const launch = useLaunchStore((s) => s.launch)
  const setInstalling = useModpackInstallStore((s) => s.setInstalling)
  const selectInstance = useInstanceStore((s) => s.selectInstance)
  const filesEndRef = useRef<HTMLDivElement>(null)

  // Reset the panel during render whenever another modpack is selected (the
  // effect below only performs the fetch).
  const detailKey = `${result.source}:${result.projectId}`
  const [prevDetailKey, setPrevDetailKey] = useState(detailKey)
  if (prevDetailKey !== detailKey) {
    setPrevDetailKey(detailKey)
    setIsLoading(true)
    setProject(null)
    setVersions([])
    setSelectedVersion(null)
    setInstanceName(result.name)
  }

  useEffect(() => {
    let cancelled = false

    Promise.all([ModAPI.getProject(result.source, result.projectId), ModAPI.getVersions({ source: result.source, projectId: result.projectId })])
      .then(([proj, vers]) => {
        if (cancelled) return
        setProject(proj)
        setVersions(vers)
      })
      .catch((err) => !cancelled && toast.error(`Falha ao carregar detalhes: ${String(err)}`))
      .finally(() => !cancelled && setIsLoading(false))

    return () => {
      cancelled = true
    }
  }, [result])

  useEffect(() => {
    filesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [installedFiles])

  const handleInstall = async () => {
    if (!instanceName.trim()) return
    if (!selectedVersion?.downloadUrl) {
      toast.error('Esta versão não está disponível para download. Escolha outra versão.')
      return
    }
    setIsInstalling(true)
    setInstalling(true)
    setIsDone(false)
    setInstalledFiles([])
    setProgress({ current: 0, total: 0 })

    const unlisten = await listen<AstroPackEvent>('modpack://event', (event) => {
      const payload = event.payload
      if (payload.type === 'progress') {
        setProgress({ current: payload.current, total: payload.total })
        setInstalledFiles((prev) => [...prev, { name: payload.name, iconUrl: payload.iconUrl }])
      }
    })

    try {
      const instance = await ModAPI.installModpack(source, {
        instanceName: instanceName.trim(),
        downloadUrl: selectedVersion.downloadUrl,
        iconUrl: result.iconUrl ?? null,
      })
      setInstalledInstanceId(instance.id)
      setProgress((prev) => ({ ...prev, current: prev.total }))
      setIsDone(true)
    } catch (err) {
      if (!String(err).includes('Instalação cancelada')) {
        toast.error(`Falha ao instalar modpack: ${String(err)}`)
      }
    } finally {
      unlisten()
      setIsInstalling(false)
      setInstalling(false)
    }
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      await ModAPI.cancelModpackInstall()
    } finally {
      setIsCancelling(false)
      setShowCancelConfirm(false)
    }
  }

  const handleStart = () => {
    if (!installedInstanceId) return
    selectInstance(installedInstanceId)
    navigate('/')
    launch(installedInstanceId)
  }

  if (isLoading) {
    return <CenteredSpinner className="h-full" />
  }

  const percent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-start gap-3">
          <EntityAvatar name={result.name} iconUrl={result.iconUrl} className="size-20 shrink-0" />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{result.name}</h3>
            {(result.loader || result.gameVersion) && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {result.loader && (
                  <Badge variant="outline" className="shrink-0">
                    {LOADER_ICON[result.loader] && <img src={LOADER_ICON[result.loader]} alt="" className="size-3" />}
                    {LOADER_LABEL[result.loader] ?? result.loader}
                  </Badge>
                )}
                {result.gameVersion && (
                  <Badge variant="secondary" className="shrink-0">
                    {result.gameVersion}
                  </Badge>
                )}
              </div>
            )}
            <p className="mt-1 text-sm text-muted-foreground">por {result.author || 'desconhecido'}</p>
          </div>
        </div>

        <p className="line-clamp-3 text-sm text-muted-foreground">{project?.description ?? result.description}</p>

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

        {project?.body && <MarkdownBody className="prose prose-sm dark:prose-invert max-w-none break-words">{project.body}</MarkdownBody>}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {isInstalling || isDone ? (
          <>
            <div className="flex items-center gap-2">
              <ProgressGroup
                className="flex-1"
                label={isDone ? 'Modpack instalado' : 'Instalando modpack'}
                value={percent}
                rightLabel={`${progress.current}/${progress.total}`}
              />
              {isInstalling && !isDone && (
                <Button variant="outline" size="icon" className="shrink-0" title="Parar instalação" onClick={() => setShowCancelConfirm(true)}>
                  <X />
                </Button>
              )}
            </div>
            <ScrollArea type="always" className="h-32 rounded-lg border">
              <div className="flex flex-col gap-0.5 p-1 pr-2">
                {installedFiles.map((file, i) => {
                  const isLast = i === installedFiles.length - 1 && !isDone
                  return (
                    <div key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                      <EntityAvatar name={file.name} iconUrl={file.iconUrl} className="size-6 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{file.name}</span>
                      {isLast ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                      ) : (
                        <Check className="size-3.5 shrink-0 text-primary" />
                      )}
                    </div>
                  )
                })}
                <div ref={filesEndRef} />
              </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modpack-instance-name">Nome da Instância</Label>
              <Input id="modpack-instance-name" value={instanceName} onChange={(e) => setInstanceName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Versão</Label>
              <ScrollArea type="always" className="h-40 rounded-lg border">
                <div className="flex flex-col gap-1 p-1 pr-2">
                  {versions.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">Nenhuma versão encontrada.</p>}
                  {versions.map((version) => {
                    const unavailable = !version.downloadUrl
                    const isActive = selectedVersion?.id === version.id
                    return (
                      <button
                        key={version.id}
                        type="button"
                        disabled={unavailable}
                        onClick={() => setSelectedVersion(version)}
                        className="flex w-full items-center justify-between rounded-md p-2 text-left text-sm hover:bg-accent data-[active=true]:bg-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                        data-active={isActive}
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="truncate">{version.name}</span>
                          {version.gameVersions[0] && (
                            <Badge variant={isActive ? 'default' : 'secondary'} className="shrink-0">
                              {version.gameVersions[0]}
                            </Badge>
                          )}
                        </span>
                        {unavailable ? (
                          <span className="shrink-0 text-xs text-muted-foreground">indisponível</span>
                        ) : (
                          isActive && <Check className="size-3.5 shrink-0 text-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {isDone ? (
          <Button onClick={handleStart}>
            <Play /> Iniciar
          </Button>
        ) : (
          <Button disabled={!selectedVersion || !instanceName.trim() || isInstalling} onClick={handleInstall}>
            <Download /> {isInstalling ? 'Instalando...' : 'Instalar Modpack'}
          </Button>
        )}
      </div>

      <ConfirmDeleteDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Parar instalação?"
        description="O download será interrompido e a instância parcialmente baixada será removida."
        confirmLabel="Parar"
        cancelLabel="Continuar instalando"
        isPending={isCancelling}
        onConfirm={handleCancel}
      />
    </div>
  )
}
