import { Loader2, PackageCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { AstropackImportProgress } from './AstropackImportProgress'
import { AstropackPreviewStep } from './AstropackPreviewStep'
import { useAstropackImport } from './useAstropackImport'

interface ImportAstropackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filePath: string
  onImported: () => void
}

export function ImportAstropackDialog({
  open,
  onOpenChange,
  filePath,
  onImported,
}: ImportAstropackDialogProps) {
  const {
    step,
    setStep,
    manifest,
    previewError,
    entries,
    current,
    total,
    importError,
    isImporting,
    overallPercent,
    canClose,
    categoryItems,
    handleToggle,
  } = useAstropackImport({ open, filePath, onImported })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && canClose) onOpenChange(false)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="size-5" />
            Importar Instância
          </DialogTitle>
        </DialogHeader>

        {step === 'loading' && (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Lendo pacote...
          </div>
        )}

        {step === 'failed-preview' && (
          <div className="flex flex-col gap-4">
            <p className="text-destructive text-sm">{previewError}</p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        )}

        {step === 'preview' && manifest && (
          <AstropackPreviewStep
            manifest={manifest}
            categoryItems={categoryItems}
            onToggle={handleToggle}
            onCancel={() => onOpenChange(false)}
            onImport={() => setStep('importing')}
          />
        )}

        {step === 'importing' && (
          <AstropackImportProgress
            entries={entries}
            current={current}
            total={total}
            overallPercent={overallPercent}
            isImporting={isImporting}
            importError={importError}
            canClose={canClose}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
