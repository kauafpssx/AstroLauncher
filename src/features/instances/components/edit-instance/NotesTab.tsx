import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ImagePlus, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Markdown } from 'tiptap-markdown'

import { Button } from '@/components/ui/button'
import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { InstanceWorkspaceAPI } from '@/features/instances/services/instance-workspace.api'

import { InsertImageDialog } from './InsertImageDialog'
import { ResizableImage } from './ResizableImageExtension'

interface NotesTabProps {
  instanceId: string
}

const SAVE_DEBOUNCE_MS = 800

export function NotesTab({ instanceId }: NotesTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Markdown.configure({ html: true }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full',
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
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        const markdown = (current.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown()
        InstanceWorkspaceAPI.writeNotes(instanceId, markdown).catch((err) => toast.error(`Falha ao salvar notas: ${String(err)}`))
      }, SAVE_DEBOUNCE_MS)
    },
  })

  useEffect(() => {
    if (!editor) return
    setIsLoading(true)
    InstanceWorkspaceAPI.readNotes(instanceId)
      .then((content) => editor.commands.setContent(content))
      .catch((err) => toast.error(`Falha ao ler notas: ${String(err)}`))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, editor])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

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

      <div className="relative min-h-[420px] resize-y overflow-auto rounded-lg border p-4">
        {isLoading ? <CenteredSpinner className="h-full" /> : <EditorContent editor={editor} className="h-full" />}
      </div>

      <InsertImageDialog
        instanceId={instanceId}
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        onSelect={(dataUri, name) => editor?.chain().focus().setImage({ src: dataUri, alt: name }).createParagraphNear().run()}
      />
    </div>
  )
}
