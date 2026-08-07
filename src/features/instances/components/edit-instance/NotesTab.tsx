import { EditorContent } from '@tiptap/react'
import { ImagePlus, MapPin } from 'lucide-react'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { Button } from '@/components/ui/button'

import { InsertImageDialog } from './InsertImageDialog'
import { NoteTabsStrip } from './NoteTabsStrip'
import { useNotesEditor } from './useNotesEditor'

interface NotesTabProps {
  instanceId: string
}

export function NotesTab({ instanceId }: NotesTabProps) {
  const {
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
  } = useNotesEditor(instanceId)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Anotações sobre esta instância. Suporta markdown (# título,
          **negrito**, listas...) e imagens: digite{' '}
          <kbd className="rounded border px-1 text-xs">/</kbd> ou use o botão
          para inserir uma screenshot.
        </p>
        <div className="flex shrink-0 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImageDialogOpen(true)}
          >
            <ImagePlus /> Inserir Imagem
          </Button>
          <Button variant="outline" size="sm" disabled>
            <MapPin /> Coordenadas
          </Button>
        </div>
      </div>

      <NoteTabsStrip
        notes={notes}
        activeId={activeId}
        isLoadingNotes={isLoadingNotes}
        renamingId={renamingId}
        renameValue={renameValue}
        setRenameValue={setRenameValue}
        setRenamingId={setRenamingId}
        onSwitch={switchTo}
        onStartRename={startRename}
        onCommitRename={commitRename}
        onDelete={setDeleteTarget}
        onCreate={handleCreate}
      />

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
        onSelect={(dataUri, name) =>
          editor
            ?.chain()
            .focus()
            .setImage({ src: dataUri, alt: name })
            .createParagraphNear()
            .run()
        }
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir nota"
        description={
          <>
            Isso vai apagar <strong>{deleteTarget?.title}</strong>{' '}
            permanentemente. Essa ação não pode ser desfeita.
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
      />
    </div>
  )
}
