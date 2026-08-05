import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Markdown } from 'tiptap-markdown'

import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import type { NoteDTO } from '@/types/note'

import { ResizableImage } from './ResizableImageExtension'

const SAVE_DEBOUNCE_MS = 800

function getMarkdown(editor: NonNullable<ReturnType<typeof useEditor>>) {
  return (
    editor.storage as unknown as { markdown: { getMarkdown: () => string } }
  ).markdown.getMarkdown()
}

/** Editor Tiptap + CRUD das notas da instância, com autosave debounced e
 * flush ao trocar de nota. */
export function useNotesEditor(instanceId: string) {
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
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full',
      },
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
        InstanceWorkspaceAPI.writeNote(
          instanceId,
          noteId,
          getMarkdown(current),
        ).catch((err) => toast.error(`Falha ao salvar nota: ${String(err)}`))
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
      InstanceWorkspaceAPI.writeNote(
        instanceId,
        activeIdRef.current,
        getMarkdown(editor),
      ).catch((err) => toast.error(`Falha ao salvar nota: ${String(err)}`))
    }
    setActiveId(noteId)
  }

  const handleCreate = async () => {
    try {
      const note = await InstanceWorkspaceAPI.createNote(
        instanceId,
        'Nova Nota',
      )
      setNotes((prev) =>
        [...prev, note].sort((a, b) => a.title.localeCompare(b.title)),
      )
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
    if (!note || !renameValue.trim() || renameValue.trim() === note.title)
      return
    try {
      const updated = await InstanceWorkspaceAPI.renameNote(
        instanceId,
        note.id,
        renameValue.trim(),
      )
      setNotes((prev) =>
        prev
          .map((n) => (n.id === note.id ? updated : n))
          .sort((a, b) => a.title.localeCompare(b.title)),
      )
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
    } catch (err) {
      toast.error(`Falha ao remover nota: ${String(err)}`)
    } finally {
      setDeleteTarget(null)
    }
  }

  return {
    notes,
    activeId,
    isLoadingNotes,
    isLoadingContent,
    editor,
    isImageDialogOpen,
    setIsImageDialogOpen,
    renamingId,
    setRenamingId,
    renameValue,
    setRenameValue,
    deleteTarget,
    setDeleteTarget,
    switchTo,
    handleCreate,
    startRename,
    commitRename,
    handleDelete,
  }
}
