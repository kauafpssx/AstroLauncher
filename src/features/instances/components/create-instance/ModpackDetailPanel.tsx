import { Download, Play } from 'lucide-react'
import { useState } from 'react'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { MarkdownBody } from '@/components/common/MarkdownBody'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX } from '@/lib/validation'
import type { ModSearchResult, ModSource } from '@/types/mods'

import { ModpackDetailHeader } from './ModpackDetailHeader'
import { ModpackInstallProgress } from './ModpackInstallProgress'
import { ModpackProjectLinks } from './ModpackProjectLinks'
import { ModpackVersionPicker } from './ModpackVersionPicker'
import { useModpackInstall } from './useModpackInstall'

interface ModpackDetailPanelProps {
  result: ModSearchResult
  source: ModSource
}

export function ModpackDetailPanel({
  result,
  source,
}: ModpackDetailPanelProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const {
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
  } = useModpackInstall(result, source)

  if (isLoading) {
    return <CenteredSpinner className="h-full" />
  }

  const onConfirmCancel = async () => {
    await handleCancel()
    setShowCancelConfirm(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <ModpackDetailHeader result={result} />

        <p className="text-muted-foreground line-clamp-3 text-sm">
          {project?.description ?? result.description}
        </p>

        {project && <ModpackProjectLinks project={project} />}

        {project?.body && (
          <MarkdownBody className="prose prose-sm dark:prose-invert max-w-none break-words">
            {project.body}
          </MarkdownBody>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        {isInstalling || isDone ? (
          <ModpackInstallProgress
            isDone={isDone}
            isInstalling={isInstalling}
            percent={percent}
            progress={progress}
            installedFiles={installedFiles}
            filesEndRef={filesEndRef}
            onRequestCancel={() => setShowCancelConfirm(true)}
          />
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="modpack-instance-name">Nome da Instância</Label>
              <Input
                id="modpack-instance-name"
                maxLength={MAX.INSTANCE_NAME}
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Versão</Label>
              <ModpackVersionPicker
                versions={versions}
                selectedVersion={selectedVersion}
                onSelect={setSelectedVersion}
              />
            </div>
          </>
        )}

        {isDone ? (
          <Button onClick={handleStart}>
            <Play /> Iniciar
          </Button>
        ) : (
          <Button
            disabled={!selectedVersion || !instanceName.trim() || isInstalling}
            onClick={handleInstall}
          >
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
        onConfirm={onConfirmCancel}
      />
    </div>
  )
}
