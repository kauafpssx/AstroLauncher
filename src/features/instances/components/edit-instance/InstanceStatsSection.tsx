import { FolderOpen } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  formatBytes,
  formatDateTime,
  formatDuration,
  parseLauncherDate,
} from '@/lib/format'
import type { InstanceDTO } from '@/types/instance'

import { InstanceWorkspaceAPI } from '../../services/instance-workspace.api'

interface InstanceStatsSectionProps {
  instance: InstanceDTO
}

export function InstanceStatsSection({ instance }: InstanceStatsSectionProps) {
  const [diskUsageBytes, setDiskUsageBytes] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    InstanceWorkspaceAPI.getDiskUsage(instance.id)
      .then((bytes) => {
        if (!cancelled) setDiskUsageBytes(bytes)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [instance.id])

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-medium">Estatísticas</h3>
        <p className="text-muted-foreground text-xs">
          Resumo de uso desta instância.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Tempo jogado</span>
            <span className="min-w-0 truncate">
              {formatDuration(instance.playtimeSeconds)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">
              Última vez jogado
            </span>
            <span className="min-w-0 truncate">
              {instance.lastPlayed
                ? formatDateTime(parseLauncherDate(instance.lastPlayed))
                : 'Nunca'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">Criada em</span>
            <span className="min-w-0 truncate">
              {formatDateTime(parseLauncherDate(instance.createdAt))}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground shrink-0">
              Tamanho em disco
            </span>
            <span className="min-w-0 truncate">
              {diskUsageBytes != null ? formatBytes(diskUsageBytes) : '—'}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => InstanceWorkspaceAPI.openFolder(instance.id)}
        >
          <FolderOpen /> Abrir pasta da instância
        </Button>
      </div>
    </div>
  )
}
