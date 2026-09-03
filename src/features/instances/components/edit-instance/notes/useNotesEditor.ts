import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Markdown } from 'tiptap-markdown'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { WaypointAPI } from '@/features/instances/services/waypoint.api'
import type { NoteDTO } from '@/types/note'
import { ResizableImage } from './ResizableImageExtension'
import { WaypointMention } from './waypoints/WaypointMentionExtension'
import { useNoteCrud } from './useNoteCrud'
const SAVE_DEBOUNCE_MS = 800
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
  const [prevActiveId, setPrevActiveId] = useState<typeof activeId>(null)
  if (prevActiveId !== activeId) {
    setPrevActiveId(activeId)
    setIsLoadingContent(true)
  }
  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({ inline: false, allowBase64: true }),
      WaypointMention.configure({ waypoints: [] }),
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
        const md = (
          current.storage as unknown as {
            markdown: { getMarkdown: () => string }
          }
        ).markdown.getMarkdown()
        InstanceWorkspaceAPI.writeNote(
          instanceId,
          noteId,
          md,
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
    WaypointAPI.list(instanceId)
      .then((result) => {
        if (editor) {
          const ext = editor.extensionManager.extensions.find(
            (e) => e.name === 'waypointMention',
          )
          if (ext) {
            ext.options.waypoints = result
          }
        }
      })
      .catch(() => {})
  }, [instanceId, editor])
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
  const { switchTo, handleCreate, startRename, commitRename, handleDelete } =
    useNoteCrud({
      instanceId,
      notes,
      setNotes,
      activeId,
      setActiveId,
      activeIdRef,
      saveTimeoutRef,
      editor,
      renamingId,
      setRenamingId,
      renameValue,
      setRenameValue,
      deleteTarget,
      setDeleteTarget,
    })
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
