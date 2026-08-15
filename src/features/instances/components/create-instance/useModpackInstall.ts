import { listen } from '@tauri-apps/api/event'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { ModAPI } from '@/features/mods/services/mod.api'
import type { AstroPackEvent } from '@/features/instances/services/astropack.api'
import type {
  ModProject,
  ModSearchResult,
  ModSource,
  ModVersion,
} from '@/types/mods'
import { getFirstIssue, instanceNameSchema } from '@/lib/validation'
import { useLaunchStore } from '@/stores/launch.store'
import { useModpackInstallStore } from '@/stores/modpack-install.store'
import { useInstanceStore } from '@/stores/instance.store'

interface InstalledFile {
  name: string
  iconUrl: string | null
}

/**
 * All the data/installation logic for the modpack panel: project and version
 * fetch, download with progress via Tauri events, cancellation and launch.
 */
export function useModpackInstall(result: ModSearchResult, source: ModSource) {
  const navigate = useNavigate()
  const [project, setProject] = useState<ModProject | null>(null)
  const [versions, setVersions] = useState<ModVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<ModVersion | null>(
    null,
  )
  const [instanceName, setInstanceName] = useState(result.name)
  const [isLoading, setIsLoading] = useState(true)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installedFiles, setInstalledFiles] = useState<InstalledFile[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [isDone, setIsDone] = useState(false)
  const [installedInstanceId, setInstalledInstanceId] = useState<string | null>(
    null,
  )
  const [isCancelling, setIsCancelling] = useState(false)
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

    Promise.all([
      ModAPI.getProject(result.source, result.projectId),
      ModAPI.getVersions({
        source: result.source,
        projectId: result.projectId,
      }),
    ])
      .then(([proj, vers]) => {
        if (cancelled) return
        setProject(proj)
        setVersions(vers)
        setSelectedVersion(vers[0] ?? null)
      })
      .catch(
        (err) =>
          !cancelled &&
          toast.error(`Falha ao carregar detalhes: ${String(err)}`),
      )
      .finally(() => !cancelled && setIsLoading(false))

    return () => {
      cancelled = true
    }
  }, [result])

  useEffect(() => {
    filesEndRef.current?.scrollIntoView({ block: 'end' })
  }, [installedFiles])

  const handleInstall = async () => {
    const issue = getFirstIssue(instanceNameSchema, instanceName)
    if (issue) {
      toast.error(issue)
      return
    }
    if (!selectedVersion?.downloadUrl) {
      toast.error(
        'Esta versão não está disponível para download. Escolha outra versão.',
      )
      return
    }
    setIsInstalling(true)
    setInstalling(true)
    setIsDone(false)
    setInstalledFiles([])
    setProgress({ current: 0, total: 0 })

    const unlisten = await listen<AstroPackEvent>(
      'modpack://event',
      (event) => {
        const payload = event.payload
        if (payload.type === 'progress') {
          setProgress({ current: payload.current, total: payload.total })
          setInstalledFiles((prev) => [
            ...prev,
            { name: payload.name, iconUrl: payload.iconUrl },
          ])
        }
      },
    )

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
    }
  }

  const handleStart = () => {
    if (!installedInstanceId) return
    selectInstance(installedInstanceId)
    navigate('/')
    launch(installedInstanceId)
  }

  const percent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return {
    project,
    versions,
    selectedVersion,
    setSelectedVersion,
    instanceName,
    setInstanceName,
    isLoading,
    isInstalling,
    installedFiles,
    progress,
    percent,
    isDone,
    isCancelling,
    filesEndRef,
    handleInstall,
    handleCancel,
    handleStart,
  }
}
