import { FileCog, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { CodeEditor } from '@/components/common/CodeEditor'
import { languageForPath } from '@/components/common/code-editor-language'
import { SaveButton } from '@/components/common/SaveDiscardButtons'
import { Button } from '@/components/ui/button'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { formatFileSize } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ConfigFileDTO } from '@/types/config-file'

interface ConfigFilesTabProps {
  instanceId: string
}

/** `options.txt`/`optionsof.txt` have their own dedicated, parsed "Minecraft" tab. */
const MINECRAFT_OPTION_FILES = new Set(['options.txt', 'optionsof.txt'])

export function ConfigFilesTab({ instanceId }: ConfigFilesTabProps) {
  const [files, setFiles] = useState<ConfigFileDTO[]>([])
  const [isLoadingList, setIsLoadingList] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [isLoadingContent, setIsLoadingContent] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Reset the editor (spinner + cleared buffer) during render whenever the
  // target file changes — the effect below only performs the fetch, so the
  // linter's "no synchronous setState in effects" rule stays satisfied.
  const loadKey = `${instanceId}:${selected ?? ''}`
  const [prevLoadKey, setPrevLoadKey] = useState(loadKey)
  if (prevLoadKey !== loadKey) {
    setPrevLoadKey(loadKey)
    setIsLoadingContent(!!selected)
    setContent('')
    setOriginalContent('')
  }

  const loadList = async () => {
    setIsLoadingList(true)
    try {
      const result = (
        await InstanceWorkspaceAPI.listConfigFiles(instanceId)
      ).filter((f) => !MINECRAFT_OPTION_FILES.has(f.path))
      setFiles(result)
      if (result.length > 0 && !result.some((f) => f.path === selected)) {
        setSelected(result[0].path)
      }
    } catch (err) {
      toast.error(`Falha ao listar arquivos de config: ${String(err)}`)
    } finally {
      setIsLoadingList(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    InstanceWorkspaceAPI.listConfigFiles(instanceId)
      .then((result) => {
        if (cancelled) return
        const filtered = result.filter(
          (f) => !MINECRAFT_OPTION_FILES.has(f.path),
        )
        setFiles(filtered)
        if (filtered.length > 0 && !filtered.some((f) => f.path === selected)) {
          setSelected(filtered[0].path)
        }
      })
      .catch(
        (err) =>
          !cancelled &&
          toast.error(`Falha ao listar arquivos de config: ${String(err)}`),
      )
      .finally(() => !cancelled && setIsLoadingList(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId])

  useEffect(() => {
    if (!selected) return
    let cancelled = false
    InstanceWorkspaceAPI.readConfigFile(instanceId, selected)
      .then((text) => {
        if (cancelled) return
        setContent(text)
        setOriginalContent(text)
      })
      .catch(
        (err) =>
          !cancelled && toast.error(`Falha ao ler arquivo: ${String(err)}`),
      )
      .finally(() => !cancelled && setIsLoadingContent(false))
    return () => {
      cancelled = true
    }
  }, [instanceId, selected])

  const isDirty = content !== originalContent

  const handleSave = async () => {
    if (!selected) return
    setIsSaving(true)
    try {
      await InstanceWorkspaceAPI.writeConfigFile(instanceId, selected, content)
      setOriginalContent(content)
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-3 overflow-hidden rounded-lg border">
      <div className="w-64 shrink-0 overflow-y-auto border-r">
        {isLoadingList ? (
          <CenteredSpinner className="h-full" />
        ) : files.length === 0 ? (
          <p className="text-muted-foreground p-4 text-center text-sm">
            Nenhum arquivo de config encontrado.
          </p>
        ) : (
          <ul className="flex flex-col p-1">
            {files.map((file) => (
              <li key={file.path}>
                <button
                  type="button"
                  onClick={() => setSelected(file.path)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left text-sm',
                    selected === file.path
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-accent',
                  )}
                >
                  <span className="flex items-center gap-1.5 truncate font-medium">
                    <FileCog className="text-muted-foreground size-3.5 shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatFileSize(file.sizeBytes)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 py-2 pr-2">
        <div className="flex shrink-0 items-center justify-between">
          <span className="text-muted-foreground truncate text-sm font-medium">
            {selected ?? 'Selecione um arquivo'}
          </span>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" onClick={loadList}>
              <RefreshCw /> Recarregar
            </Button>
            <SaveButton
              onClick={handleSave}
              disabled={!selected || !isDirty || isSaving}
              isSaving={isSaving}
            />
          </div>
        </div>
        {isLoadingContent ? (
          <CenteredSpinner className="min-h-0 flex-1" />
        ) : (
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <CodeEditor
              value={content}
              onChange={setContent}
              language={languageForPath(selected)}
              disabled={!selected}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}
