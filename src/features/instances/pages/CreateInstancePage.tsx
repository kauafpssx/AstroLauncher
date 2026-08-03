import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { MC_ICONS } from '@/data/mc-icons'
import { useDiscordPresence } from '@/hooks/useDiscordPresence'
import { useInstanceStore } from '@/stores/instance.store'
import type { VersionDTO, VersionType } from '@/types/version'

import { FiltersCard } from '../components/create-instance/FiltersCard'
import { InstanceInfoCard } from '../components/create-instance/InstanceInfoCard'
import type { LoaderId } from '../components/create-instance/LoaderSelectionCard'
import { LoaderSelectionCard } from '../components/create-instance/LoaderSelectionCard'
import { ModpackBrowserPanel } from '../components/create-instance/ModpackBrowserPanel'
import type { Platform } from '../components/create-instance/PlatformSidebar'
import { PlatformSidebar } from '../components/create-instance/PlatformSidebar'
import { SelectedVersionCard } from '../components/create-instance/SelectedVersionCard'
import { SourcePlaceholder } from '../components/create-instance/SourcePlaceholder'
import { VersionSelectionCard } from '../components/create-instance/VersionSelectionCard'
import { useVersions } from '../hooks/useVersions'
import { useFolders } from '../hooks/useFolders'

function randomIconPath(): string {
  return MC_ICONS[Math.floor(Math.random() * MC_ICONS.length)].path
}

export function CreateInstancePage() {
  const navigate = useNavigate()
  const createInstance = useInstanceStore((s) => s.createInstance)
  const { versions, isLoading, refetch } = useVersions()
  const { folders } = useFolders()

  const [platform, setPlatform] = useState<Platform>('custom')
  const [name, setName] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [iconPath, setIconPath] = useState<string | null>(randomIconPath)
  const [search, setSearch] = useState('')
  const [typeFilters, setTypeFilters] = useState<VersionType[]>(['release'])
  const [version, setVersion] = useState<VersionDTO | null>(null)
  const [loader, setLoader] = useState<LoaderId | null>('vanilla')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useDiscordPresence('Criando uma instância', name.trim() || 'Nova instância')

  // Auto-select the first release once the version list loads. Done during
  // render (React's "adjust state when a prop changes" pattern) instead of an
  // effect, so the linter's set-state-in-effect rule stays satisfied.
  const [prevVersions, setPrevVersions] = useState<VersionDTO[]>(versions)
  if (prevVersions !== versions) {
    setPrevVersions(versions)
    if (!version && versions.length > 0) {
      setVersion(versions.find((v) => v.type === 'release') ?? versions[0])
    }
  }

  const isCustom = platform === 'custom'
  const canSubmit =
    isCustom &&
    name.trim().length > 0 &&
    version !== null &&
    loader !== null &&
    !isSubmitting

  const handleSubmit = async () => {
    if (!version || !loader) return
    setIsSubmitting(true)
    try {
      await createInstance({
        name: name.trim(),
        version: version.id,
        loader: loader === 'vanilla' ? null : loader,
        folderId: group,
        iconPath,
      })
      toast.success('Instância criada')
      navigate('/')
    } catch (err) {
      toast.error(`Falha ao criar instância: ${String(err)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen">
      <PlatformSidebar platform={platform} onChange={setPlatform} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 p-6">
            {isCustom ? (
              <>
                <InstanceInfoCard
                  name={name}
                  onNameChange={setName}
                  group={group}
                  onGroupChange={setGroup}
                  iconPath={iconPath}
                  onIconChange={setIconPath}
                  folders={folders}
                />

                <div className="flex min-h-0 flex-1 gap-6">
                  <div className="flex min-h-0 min-w-0 flex-[2] flex-col">
                    <VersionSelectionCard
                      versions={versions}
                      isLoading={isLoading}
                      search={search}
                      onSearchChange={setSearch}
                      typeFilters={typeFilters}
                      selectedVersionId={version?.id ?? null}
                      onSelect={setVersion}
                      onRefresh={refetch}
                    />
                  </div>

                  <div className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">
                    <SelectedVersionCard version={version} />
                    <FiltersCard
                      typeFilters={typeFilters}
                      onChange={setTypeFilters}
                    />
                    <LoaderSelectionCard
                      selected={loader}
                      onSelect={setLoader}
                    />
                  </div>
                </div>
              </>
            ) : platform === 'modrinth' || platform === 'curseforge' ? (
              <ModpackBrowserPanel source={platform} />
            ) : (
              <SourcePlaceholder
                platform={platform}
                onAction={() => toast.info('Ainda não implementado')}
              />
            )}
          </div>
        </div>

        {isCustom && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t px-6 py-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={handleSubmit}>
              {isSubmitting ? 'Criando...' : 'Criar Instância'}
            </Button>
          </footer>
        )}
      </div>
    </div>
  )
}
