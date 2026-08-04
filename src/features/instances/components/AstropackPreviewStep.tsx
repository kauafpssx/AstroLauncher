import { EntityAvatar } from '@/components/common/EntityAvatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { groupByContentKind } from '@/lib/content-kind'

import {
  AstroPackCategoryList,
  type AstroPackCategoryItem,
} from './AstroPackCategoryList'
import type { AstroPackManifest } from '../services/astropack.api'

interface AstropackPreviewStepProps {
  manifest: AstroPackManifest
  categoryItems: AstroPackCategoryItem[]
  onToggle: (key: string, checked: boolean) => void
  onCancel: () => void
  onImport: () => void
}

export function AstropackPreviewStep({
  manifest,
  categoryItems,
  onToggle,
  onCancel,
  onImport,
}: AstropackPreviewStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-3 text-sm">
        <p className="font-medium">{manifest.name}</p>
        <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>Versão: {manifest.version}</span>
          {manifest.loader && (
            <span>
              Loader: {manifest.loader}
              {manifest.loaderVersion ? ` ${manifest.loaderVersion}` : ''}
            </span>
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-sm">Escolha o que importar.</p>
      <AstroPackCategoryList items={categoryItems} onToggle={onToggle} />

      {manifest.contents.length > 0 && (
        <ScrollArea className="max-h-48">
          <div className="flex flex-col gap-3">
            {groupByContentKind(manifest.contents).map((group) => (
              <div key={group.kind} className="flex flex-col gap-1">
                <p className="text-muted-foreground px-2 text-xs font-medium">
                  {group.label}
                </p>
                {group.items.map((entry) => (
                  <div
                    key={`${entry.kind}-${entry.fileName}`}
                    className="hover:bg-accent flex items-center gap-3 rounded-lg p-2"
                  >
                    <EntityAvatar
                      name={entry.name}
                      iconUrl={entry.iconUrl}
                      className="size-7 shrink-0"
                      fallbackClassName="text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{entry.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onImport}>Deseja importar?</Button>
      </div>
    </div>
  )
}
