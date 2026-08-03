import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ImagePlus, MapPin, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Markdown } from 'tiptap-markdown'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { cn } from '@/lib/utils'
import type { NoteDTO } from '@/types/note'

import { InsertImageDialog } from './InsertImageDialog'
import { ResizableImage } from './ResizableImageExtension'

interface NotesTabProps {
  instanceId: string
}

const SAVE_DEBOUNCE_MS = 800

function getMarkdown(editor: NonNullable<ReturnType<typeof useEditor>>) {
  return (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
}

export function NotesTab({ instanceId }: NotesTabProps) {
  const [notes, setNotes] = useState<NoteDTO[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isLoadingNotes, setIsLoadingNotes] = useState(true)
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<NoteDTO | null>(null)

  const activeIdRef = useRef<string | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show the spinner during render whenever the active note changes (the
  // effect below only performs the fetch, avoiding synchronous setState).
  const [prevActiveId, setPrevActiveId] = useState<typeof activeId>(null)
  if (prevActiveId !== activeId) {
    setPrevActiveId(activeId)
    setIsLoadingContent(true)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Markdown.configure({ html: true }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full' },
      handleKeyDown: (_view, event) => {
        if (event.key === '/') {
          setIsImageDialogOpen(true)
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: current }) => {
      const noteId = activeIdRef.current
      if (!noteId) return
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        InstanceWorkspaceAPI.writeNote(instanceId, noteId, getMarkdown(current)).catch((err) =>
          toast.error(`Falha ao salvar nota: ${String(err)}`),
        )
      }, SAVE_DEBOUNCE_MS)
    },
  })

  useEffect(() => {
    InstanceWorkspaceAPI.listNotes(instanceId)
      .then((result) => {
        setNotes(result)
        setActiveId(result[0]?.id ?? null)
      })
      .catch((err) => toast.error(`Falha ao listar notas: ${String(err)}`))
      .finally(() => setIsLoadingNotes(false))
  }, [instanceId])

  useEffect(() => {
    if (!editor || !activeId) return
    InstanceWorkspaceAPI.readNote(instanceId, activeId)
      .then((content) => {
        editor.commands.setContent(content, { emitUpdate: false })
        activeIdRef.current = activeId
      })
      .catch((err) => toast.error(`Falha ao ler nota: ${String(err)}`))
      .finally(() => setIsLoadingContent(false))
  }, [instanceId, activeId, editor])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const switchTo = (noteId: string) => {
    if (noteId === activeId || !editor) return
    if (saveTimeoutRef.current && activeIdRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
      InstanceWorkspaceAPI.writeNote(instanceId, activeIdRef.current, getMarkdown(editor)).catch((err) =>
        toast.error(`Falha ao salvar nota: ${String(err)}`),
      )
    }
    setActiveId(noteId)
  }

  const handleCreate = async () => {
    try {
      const note = await InstanceWorkspaceAPI.createNote(instanceId, 'Nova Nota')
      setNotes((prev) => [...prev, note].sort((a, b) => a.title.localeCompare(b.title)))
      switchTo(note.id)
    } catch (err) {
      toast.error(`Falha ao criar nota: ${String(err)}`)
    }
  }

  const startRename = (note: NoteDTO) => {
    setRenamingId(note.id)
    setRenameValue(note.title)
  }

  const commitRename = async () => {
    const note = notes.find((n) => n.id === renamingId)
    setRenamingId(null)
    if (!note || !renameValue.trim() || renameValue.trim() === note.title) return
    try {
      const updated = await InstanceWorkspaceAPI.renameNote(instanceId, note.id, renameValue.trim())
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)).sort((a, b) => a.title.localeCompare(b.title)))
      if (activeId === note.id) {
        activeIdRef.current = updated.id
        setActiveId(updated.id)
      }
    } catch (err) {
      toast.error(`Falha ao renomear nota: ${String(err)}`)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await InstanceWorkspaceAPI.deleteNote(instanceId, deleteTarget.id)
      const remaining = notes.filter((n) => n.id !== deleteTarget.id)
      setNotes(remaining)
      if (activeId === deleteTarget.id) {
        setActiveId(remaining[0]?.id ?? null)
      }
      toast.success('Nota removida')
    } catch (err) {
      toast.error(`Falha ao remover nota: ${String(err)}`)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Anotações sobre esta instância. Suporta markdown (# título, **negrito**, listas...) e imagens — digite{' '}
          <kbd className="rounded border px-1 text-xs">/</kbd> ou use o botão para inserir uma screenshot.
        </p>
        <div className="flex shrink-0 gap-1.5">
          <Button variant="outline" size="sm" onClick={() => setIsImageDialogOpen(true)}>
            <ImagePlus /> Inserir Imagem
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Coordenadas: em breve')}>
            <MapPin /> Coordenadas
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b pb-1">
        {isLoadingNotes ? (
          <span className="px-2 py-1 text-xs text-muted-foreground">Carregando notas...</span>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                'group flex shrink-0 items-center gap-1 rounded-t-md border border-b-0 px-2.5 py-1.5 text-sm',
                activeId === note.id ? 'border-border bg-background font-medium' : 'border-transparent text-muted-foreground hover:bg-accent',
              )}
            >
              {renamingId === note.id ? (
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenamingId(null)
                  }}
                  className="h-6 w-28 px-1 text-sm"
                />
              ) : (
                <button type="button" onClick={() => switchTo(note.id)} className="max-w-32 truncate">
                  {note.title}
                </button>
              )}
              <button
                type="button"
                onClick={() => startRename(note)}
                className="hidden text-muted-foreground hover:text-foreground group-hover:inline-flex"
                title="Renomear"
              >
                <Pencil className="size-3" />
              </button>
              {notes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(note)}
                  className="hidden text-muted-foreground hover:text-destructive group-hover:inline-flex"
                  title="Excluir"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))
        )}
        <Button variant="ghost" size="icon-sm" onClick={handleCreate} title="Nova nota">
          <Plus className="size-4" />
        </Button>
      </div>

      <div className="relative min-h-[420px] resize-y overflow-auto rounded-lg border p-4">
        {isLoadingContent || !editor ? (
          <CenteredSpinner className="h-full" />
        ) : (
          <EditorContent editor={editor} className="h-full" />
        )}
      </div>

      <InsertImageDialog
        instanceId={instanceId}
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        onSelect={(dataUri, name) => editor?.chain().focus().setImage({ src: dataUri, alt: name }).createParagraphNear().run()}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir nota"
        description={
          <>
            Isso vai apagar <strong>{deleteTarget?.title}</strong> permanentemente. Essa ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
      />
    </div>
  )
}
