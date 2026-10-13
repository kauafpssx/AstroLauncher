import type { Editor } from '@tiptap/react'
import { toast } from 'sonner'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'
import { getFirstIssue, noteTitleSchema } from '@/lib/validation'
import type { NoteDTO } from '@/types/note'
interface UseNoteCrudArgs {
  instanceId: string
  notes: NoteDTO[]
  setNotes: React.Dispatch<React.SetStateAction<NoteDTO[]>>
  activeId: string | null
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>
  activeIdRef: React.MutableRefObject<string | null>
  saveTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  editor: Editor | null
  renamingId: string | null
  setRenamingId: React.Dispatch<React.SetStateAction<string | null>>
  renameValue: string
  setRenameValue: React.Dispatch<React.SetStateAction<string>>
  deleteTarget: NoteDTO | null
  setDeleteTarget: React.Dispatch<React.SetStateAction<NoteDTO | null>>
}
function getMarkdown(editor: Editor) {
  return (
    editor.storage as unknown as {
      markdown: { getMarkdown: () => string }
    }
  ).markdown.getMarkdown()
}
export function useNoteCrud({
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
}: UseNoteCrudArgs) {
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
    if (!note) return
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === note.title) {
      setRenamingId(null)
      return
    }
    const issue = getFirstIssue(noteTitleSchema, trimmed)
    if (issue) {
      toast.error(issue)
      return
    }
    setRenamingId(null)
    try {
      const updated = await InstanceWorkspaceAPI.renameNote(
        instanceId,
        note.id,
        trimmed,
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
  return { switchTo, handleCreate, startRename, commitRename, handleDelete }
}
