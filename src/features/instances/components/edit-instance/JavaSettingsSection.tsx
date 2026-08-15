import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import {
  Calendar,
  FolderSearch,
  HardDrive,
  Settings,
  Shield,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/format'
import type { JavaInfoDTO } from '@/types/java'

import { InstanceAPI } from '../../services/instance.api'

interface JavaSettingsSectionProps {
  instanceId: string
  javaPath: string | null
  onJavaPathChange: (value: string | null) => void
}

export function JavaSettingsSection({
  instanceId,
  javaPath,
  onJavaPathChange,
}: JavaSettingsSectionProps) {
  const [javaInfo, setJavaInfo] = useState<JavaInfoDTO | null>(null)

  useEffect(() => {
    let cancelled = false
    InstanceAPI.getJavaInfo(javaPath, instanceId)
      .then((info) => {
        if (!cancelled) setJavaInfo(info)
      })
      .catch(() => {
        if (!cancelled) setJavaInfo(null)
      })
    return () => {
      cancelled = true
    }
  }, [javaPath, instanceId])

  const detectedVersion = javaInfo?.majorVersion ?? null

  const handleBrowse = async () => {
    const selected = await openFileDialog({
      multiple: false,
      filters: [{ name: 'Java', extensions: ['exe'] }],
    })
    if (!selected || Array.isArray(selected)) return
    onJavaPathChange(selected)
  }

  return (
    <div className="relative flex flex-1 flex-col gap-3 rounded-lg border p-4">
      <Badge variant="secondary" className="absolute top-3 right-3 shrink-0">
        {javaPath ? 'Customizado' : 'Automático'}
      </Badge>

      <div className="flex flex-1 flex-col justify-center">
        <div className="flex flex-wrap gap-3">
          <div className="bg-muted flex w-20 shrink-0 items-center justify-center self-stretch rounded-lg p-2">
            <img
              src="/logos/Java.svg"
              alt=""
              className="size-full object-contain"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="min-w-0">
              <div className="truncate text-2xl leading-none font-bold tabular-nums">
                {detectedVersion != null
                  ? `Java ${detectedVersion}`
                  : javaPath
                    ? 'Não encontrado'
                    : 'A baixar'}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                Instalação usada para rodar o jogo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3.5 shrink-0" />
                  Versão
                </div>
                <span className="truncate font-medium">
                  {detectedVersion ?? '—'}
                </span>
              </div>
              <div className="bg-border hidden h-8 w-px sm:block" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="text-muted-foreground flex items-center gap-1">
                  <Shield className="size-3.5 shrink-0" />
                  Fornecedor
                </div>
                <span className="truncate font-medium">Eclipse Temurin</span>
              </div>
              <div className="bg-border hidden h-8 w-px sm:block" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="text-muted-foreground flex items-center gap-1">
                  <HardDrive className="size-3.5 shrink-0" />
                  Tamanho
                </div>
                <span className="truncate font-medium">
                  {javaInfo?.installSizeBytes != null
                    ? formatBytes(javaInfo.installSizeBytes)
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
          <Settings className="size-3.5 shrink-0" />
          <span className="truncate" title={javaPath ?? undefined}>
            {javaPath ?? 'Gerenciado pelo launcher'}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleBrowse}
            aria-label="Escolher outra instalação de Java"
          >
            <FolderSearch />
          </Button>
          {javaPath && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onJavaPathChange(null)}
              aria-label="Usar o Java gerenciado pelo launcher"
            >
              <X />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
