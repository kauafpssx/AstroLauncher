import { Image as ImageIcon, Search } from 'lucide-react'
import { useState } from 'react'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useInstanceScreenshots } from '@/features/instances/hooks/useInstanceScreenshots'

interface InsertImageDialogProps {
  instanceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (dataUri: string, name: string) => void
}

export function InsertImageDialog({ instanceId, open, onOpenChange, onSelect }: InsertImageDialogProps) {
  const { shots, isLoading } = useInstanceScreenshots(instanceId)
  const [query, setQuery] = useState('')

  const filtered = shots.filter((s) => s.info.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inserir Imagem</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {isLoading ? (
          <CenteredSpinner className="h-48" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
            <ImageIcon className="size-8" />
            <p>Nenhuma screenshot encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-1">
            {filtered.map((shot) => (
              <button
                key={shot.info.name}
                type="button"
                onClick={() => {
                  onSelect(shot.dataUri, shot.info.name)
                  onOpenChange(false)
                }}
                className="group flex flex-col gap-1 overflow-hidden rounded-lg border text-left transition-colors hover:border-primary"
              >
                <div className="aspect-video overflow-hidden bg-muted">
                  <img src={shot.dataUri} alt={shot.info.name} className="size-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <p className="truncate px-1.5 pb-1.5 text-xs text-muted-foreground">{shot.info.name}</p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
