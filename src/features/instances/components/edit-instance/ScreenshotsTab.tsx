import { save as saveFileDialog } from '@tauri-apps/plugin-dialog'
import { writeImage } from '@tauri-apps/plugin-clipboard-manager'
import { Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useInstanceScreenshots,
  type LoadedScreenshot,
} from '@/features/instances/hooks/useInstanceScreenshots'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'

import { ScreenshotViewerDialog } from './ScreenshotViewerDialog'

interface ScreenshotsTabProps {
  instanceId: string
}

function dataUriToBytes(dataUri: string): Uint8Array {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function ScreenshotsTab({ instanceId }: ScreenshotsTabProps) {
  const { shots, isLoading, setShots } = useInstanceScreenshots(instanceId)
  const [columns, setColumns] = useState('4')
  const [viewing, setViewing] = useState<LoadedScreenshot | null>(null)

  const handleDownload = async (shot: LoadedScreenshot) => {
    const destPath = await saveFileDialog({
      defaultPath: shot.info.name,
      filters: [{ name: 'PNG', extensions: ['png'] }],
    })
    if (!destPath) return
    try {
      await InstanceWorkspaceAPI.saveScreenshotAs(
        instanceId,
        shot.info.name,
        destPath,
      )
      toast.success('Screenshot salva')
    } catch (err) {
      toast.error(`Falha ao salvar: ${String(err)}`)
    }
  }

  const handleCopy = async (shot: LoadedScreenshot) => {
    try {
      await writeImage(dataUriToBytes(shot.dataUri))
      toast.success('Copiado para a área de transferência')
    } catch (err) {
      toast.error(`Falha ao copiar: ${String(err)}`)
    }
  }

  const handleRenamed = (oldName: string, newName: string) => {
    setShots((prev) =>
      prev.map((s) =>
        s.info.name === oldName
          ? { ...s, info: { ...s.info, name: newName } }
          : s,
      ),
    )
    setViewing((prev) =>
      prev && prev.info.name === oldName
        ? { ...prev, info: { ...prev.info, name: newName } }
        : prev,
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Capturas de tela desta instância.
        </p>
        <Select value={columns} onValueChange={setColumns}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} colunas
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CenteredSpinner className="h-40" />
      ) : shots.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
          <ImageIcon className="size-8" />
          <p>Nenhuma screenshot encontrada.</p>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {shots.map((shot) => (
            <button
              key={shot.info.name}
              type="button"
              onClick={() => setViewing(shot)}
              className="group bg-muted relative aspect-video overflow-hidden rounded-lg border"
            >
              <img
                src={shot.dataUri}
                alt={shot.info.name}
                className="size-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {viewing && (
        <ScreenshotViewerDialog
          instanceId={instanceId}
          name={viewing.info.name}
          dataUri={viewing.dataUri}
          onOpenChange={(open) => !open && setViewing(null)}
          onDownload={() => handleDownload(viewing)}
          onCopy={() => handleCopy(viewing)}
          onRenamed={(newName) => handleRenamed(viewing.info.name, newName)}
        />
      )}
    </div>
  )
}
