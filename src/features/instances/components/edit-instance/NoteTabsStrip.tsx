import { Pencil, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { tooltipProps } from '@/lib/tooltip'
import { cn } from '@/lib/utils'
import type { NoteDTO } from '@/types/note'

interface NoteTabsStripProps {
  notes: NoteDTO[]
  activeId: string | null
  isLoadingNotes: boolean
  renamingId: string | null
  renameValue: string
  setRenameValue: (value: string) => void
  setRenamingId: (id: string | null) => void
  onSwitch: (noteId: string) => void
  onStartRename: (note: NoteDTO) => void
  onCommitRename: () => void
  onDelete: (note: NoteDTO) => void
  onCreate: () => void
}

export function NoteTabsStrip({
  notes,
  activeId,
  isLoadingNotes,
  renamingId,
  renameValue,
  setRenameValue,
  setRenamingId,
  onSwitch,
  onStartRename,
  onCommitRename,
  onDelete,
  onCreate,
}: NoteTabsStripProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b pb-1">
      {isLoadingNotes ? (
        <span className="text-muted-foreground px-2 py-1 text-xs">
          Carregando notas...
        </span>
      ) : (
        notes.map((note) => (
          <div
            key={note.id}
            className={cn(
              'group flex shrink-0 items-center gap-1 rounded-t-md border border-b-0 px-2.5 py-1.5 text-sm',
              activeId === note.id
                ? 'border-border bg-background font-medium'
                : 'text-muted-foreground hover:bg-accent border-transparent',
            )}
          >
            {renamingId === note.id ? (
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={onCommitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCommitRename()
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                className="h-6 w-28 px-1 text-sm"
              />
            ) : (
              <button
                type="button"
                onClick={() => onSwitch(note.id)}
                className="max-w-32 truncate"
              >
                {note.title}
              </button>
            )}
            <button
              type="button"
              onClick={() => onStartRename(note)}
              className="text-muted-foreground hover:text-foreground hidden group-hover:inline-flex"
              {...tooltipProps('Renomear')}
            >
              <Pencil className="size-3" />
            </button>
            {notes.length > 1 && (
              <button
                type="button"
                onClick={() => onDelete(note)}
                className="text-muted-foreground hover:text-destructive hidden group-hover:inline-flex"
                {...tooltipProps('Excluir')}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        ))
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onCreate}
        {...tooltipProps('Nova nota')}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}
