import { Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { SearchInput } from '@/components/common/SearchInput'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInstanceScreenshots } from '@/features/instances/hooks/useInstanceScreenshots'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'

interface InsertImageDialogProps {
  instanceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (dataUri: string, name: string) => void
}

export function InsertImageDialog({
  instanceId,
  open,
  onOpenChange,
  onSelect,
}: InsertImageDialogProps) {
  const { shots, isLoading } = useInstanceScreenshots(instanceId)
  const [query, setQuery] = useState('')

  const filtered = shots.filter((s) =>
    s.info.name.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inserir Imagem</DialogTitle>
        </DialogHeader>

        <SearchInput
          placeholder="Buscar por nome..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {isLoading ? (
          <CenteredSpinner className="h-48" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="Nenhuma screenshot encontrada."
            className="p-10"
          />
        ) : (
          <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-1">
            {filtered.map((shot) => (
              <button
                key={shot.info.name}
                type="button"
                onClick={async () => {
                  // The grid only ever loaded a downscaled preview — fetch
                  // the real PNG before handing it to the note editor.
                  try {
                    const fullDataUri =
                      await InstanceWorkspaceAPI.readScreenshot(
                        instanceId,
                        shot.info.name,
                      )
                    onSelect(fullDataUri, shot.info.name)
                    onOpenChange(false)
                  } catch (err) {
                    toast.error(`Falha ao carregar imagem: ${String(err)}`)
                  }
                }}
                className="group hover:border-primary flex flex-col gap-1 overflow-hidden rounded-lg border text-left transition-colors"
              >
                <div className="bg-muted aspect-video overflow-hidden">
                  <img
                    src={shot.thumbnailDataUri}
                    alt={shot.info.name}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <p className="text-muted-foreground truncate px-1.5 pb-1.5 text-xs">
                  {shot.info.name}
                </p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
