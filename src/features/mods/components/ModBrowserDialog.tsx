import { Hourglass } from 'lucide-react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import type { ContentKind } from '@/types/mods'

import { ModBrowserList } from './ModBrowserList'
import { ModDetailPanel } from './ModDetailPanel'
import { ModReviewPanel } from './ModReviewPanel'
import { selectionKey, useModBrowser } from './useModBrowser'

interface ModBrowserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instanceId: string
  gameVersion?: string
  loader?: string | null
  kind?: ContentKind
  onInstalled: () => void
}

export function ModBrowserDialog({
  open,
  onOpenChange,
  instanceId,
  gameVersion,
  loader,
  kind = 'mod',
  onInstalled,
}: ModBrowserDialogProps) {
  const browser = useModBrowser({
    open,
    onOpenChange,
    instanceId,
    gameVersion,
    loader,
    kind,
    onInstalled,
  })
  const {
    viewing,
    selection,
    view,
    setView,
    pendingKeys,
    installedKeys,
    installedFileNames,
    effectiveLoader,
    kindLabel,
    toggleSelection,
  } = browser

  const viewingKey = viewing
    ? selectionKey(viewing.source, viewing.projectId)
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[90vh] max-h-[820px] flex-col gap-0 p-0 sm:max-w-6xl"
        // Interacting with the resize handle sometimes gets misread by
        // Radix's dismissable layer as an outside interaction, closing the
        // dialog. Disable dismiss-on-outside-interaction here — Escape and
        // the close button still work.
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Buscar {kindLabel}</DialogTitle>

        {view === 'review' ? (
          <ModReviewPanel
            instanceId={instanceId}
            selection={selection}
            gameVersion={gameVersion}
            loader={effectiveLoader}
            kind={kind}
            installedKeys={installedKeys}
            installedFileNames={installedFileNames}
            onBack={() => setView('browse')}
            onInstalled={() => {
              onInstalled()
              onOpenChange(false)
            }}
          />
        ) : (
          <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-0 flex-1"
          >
            <ResizablePanel minSize="480px">
              <ModBrowserList browser={browser} />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize="384px" minSize="320px" maxSize="50%">
              {viewing && viewingKey ? (
                <ModDetailPanel
                  result={viewing}
                  gameVersion={gameVersion}
                  loader={effectiveLoader}
                  isSelected={
                    !!selection[viewingKey] || pendingKeys.has(viewingKey)
                  }
                  isInstalled={installedKeys.has(viewingKey)}
                  installedFileNames={installedFileNames}
                  onToggleSelect={(version) =>
                    toggleSelection(viewing, version)
                  }
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6">
                  <Hourglass className="text-muted-foreground size-8" />
                </div>
              )}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </DialogContent>
    </Dialog>
  )
}
