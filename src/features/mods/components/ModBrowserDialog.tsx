import { EmptyState } from '@/components/common/EmptyState'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
        className="flex h-[85vh] max-h-[720px] flex-col gap-0 p-0 sm:max-w-5xl"
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
          <div className="flex min-h-0 flex-1">
            <ModBrowserList browser={browser} />

            <div className="w-96 shrink-0">
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
                <EmptyState
                  title="Selecione um item na lista para ver detalhes."
                  className="h-full p-6"
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
