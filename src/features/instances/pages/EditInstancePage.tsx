import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InstalledContentTab } from '@/features/mods/components/InstalledContentTab'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import { useInstanceStore } from '@/stores/instance.store'

import { ConfigEditorTab } from '../components/edit-instance/ConfigEditorTab'
import type { EditInstanceTab } from '../components/edit-instance/EditInstanceSidebar'
import { EditInstanceSidebar } from '../components/edit-instance/EditInstanceSidebar'
import { ExportAstropackDialog } from '../components/ExportAstropackDialog'
import { DeleteInstanceDialog } from '../components/DeleteInstanceDialog'
import { LogTab } from '../components/edit-instance/LogTab'
import { NotesTab } from '../components/edit-instance/NotesTab'
import { ScreenshotsTab } from '../components/edit-instance/ScreenshotsTab'
import { SeedMapTab } from '../components/edit-instance/SeedMapTab'
import { ServersTab } from '../components/edit-instance/ServersTab'
import { SettingsTab } from '../components/edit-instance/SettingsTab'
import { WorldsTab } from '../components/edit-instance/WorldsTab'
import { useInstances } from '../hooks/useInstances'
import { useLaunchInstance } from '../hooks/useLaunchInstance'
import { openFolder } from '../lib/instance-actions'

export function EditInstancePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { instances, deleteInstance } = useInstances()
  const selectInstance = useInstanceStore((s) => s.selectInstance)
  const { launch, stop, runningId } = useLaunchInstance()
  const [tab, setTab] = useState<EditInstanceTab>('settings')
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const instance = instances.find((i) => i.id === id)

  useDiscordPresence(
    'Editando uma instância',
    instance?.name ?? 'Carregando...',
  )

  if (!instance) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">Instância não encontrada.</p>
        <Button onClick={() => navigate('/')}>Voltar</Button>
      </div>
    )
  }

  const isRunning = runningId === instance.id

  const goBack = () => {
    selectInstance(instance.id)
    navigate('/')
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteInstance(instance.id)
      navigate('/')
    } catch (err) {
      toast.error(`Falha ao excluir: ${String(err)}`)
    } finally {
      setIsDeleteOpen(false)
    }
  }

  return (
    <div className="flex h-screen">
      <EditInstanceSidebar
        instanceName={instance.name}
        active={tab}
        onChange={setTab}
        onBack={goBack}
        isRunning={isRunning}
        onLaunch={() => launch(instance.id)}
        onStop={() => stop(instance.id)}
        onOpenFolder={() => openFolder(instance.id)}
        onExport={() => setIsExportOpen(true)}
        onDelete={() => setIsDeleteOpen(true)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {tab === 'log' || tab === 'config-editor' || tab === 'seed-map' ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col p-6">
            {tab === 'log' && <LogTab instanceId={instance.id} />}
            {tab === 'config-editor' && (
              <ConfigEditorTab instanceId={instance.id} />
            )}
            {tab === 'seed-map' && <SeedMapTab />}
          </div>
        ) : (
          <ScrollArea type="always" className="min-h-0 flex-1">
            <div className="flex h-full flex-col p-6">
              {tab === 'settings' && <SettingsTab instance={instance} />}
              {tab === 'worlds' && <WorldsTab instanceId={instance.id} />}
              {tab === 'notes' && <NotesTab instanceId={instance.id} />}
              {tab === 'mods' && (
                <InstalledContentTab
                  instanceId={instance.id}
                  gameVersion={instance.version}
                  loader={instance.loader}
                  kind="mod"
                />
              )}
              {tab === 'resource-packs' && (
                <InstalledContentTab
                  instanceId={instance.id}
                  gameVersion={instance.version}
                  loader={instance.loader}
                  kind="resourcepack"
                />
              )}
              {tab === 'shader-packs' && (
                <InstalledContentTab
                  instanceId={instance.id}
                  gameVersion={instance.version}
                  loader={instance.loader}
                  kind="shader"
                />
              )}
              {tab === 'servers' && <ServersTab instanceId={instance.id} />}
              {tab === 'screenshots' && (
                <ScreenshotsTab instanceId={instance.id} />
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      <ExportAstropackDialog
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        instance={instance}
      />
      <DeleteInstanceDialog
        instance={isDeleteOpen ? instance : null}
        isRunning={isRunning}
        onOpenChange={(open) => setIsDeleteOpen(open)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
