import { listen } from '@tauri-apps/api/event'
import { save } from '@tauri-apps/plugin-dialog'
import { Loader2, PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { ProgressGroup } from '@/components/common/ProgressGroup'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resolveIconSrc } from '@/lib/icon-src'
import type { InstanceDTO } from '@/types/instance'

import { AstroPackCategoryList } from './AstroPackCategoryList'
import {
  buildExportCategoryItems,
  iconToDataUri,
} from './export-astropack-helpers'
import {
  ALL_SELECTED,
  AstroPackAPI,
  type AstroPackEvent,
  type ExportSelection,
  type ExportSummary,
} from '../services/astropack.api'

interface ExportAstropackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance: InstanceDTO
}

export function ExportAstropackDialog({
  open,
  onOpenChange,
  instance,
}: ExportAstropackDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [summary, setSummary] = useState<ExportSummary | null>(null)
  const [selection, setSelection] = useState<ExportSelection>(ALL_SELECTED)
  const [exportCurrent, setExportCurrent] = useState(0)
  const [exportTotal, setExportTotal] = useState(0)
  const [exportItemName, setExportItemName] = useState('')

  // Clear the previous summary during render when the dialog reopens (the
  // effect below only performs the fetch).
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) setSummary(null)
  }

  useEffect(() => {
    if (!isExporting) return
    const unlisten = listen<AstroPackEvent>('astropack://event', (event) => {
      if (event.payload.type !== 'progress') return
      setExportCurrent(event.payload.current + 1)
      setExportTotal(event.payload.total)
      setExportItemName(event.payload.name)
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [isExporting])

  useEffect(() => {
    if (!open) return
    AstroPackAPI.getExportSummary(instance.id)
      .then((result) => {
        setSummary(result)
        setSelection({
          settings: result.hasSettings,
          worlds: result.worlds > 0,
          notes: result.hasNotes,
          mods: result.mods > 0,
          resourcepacks: result.resourcepacks > 0,
          shaders: result.shaders > 0,
          servers: result.servers > 0,
          screenshots: result.screenshots > 0,
        })
      })
      .catch((err) => toast.error(`Falha ao carregar resumo: ${String(err)}`))
  }, [open, instance.id])

  const items = buildExportCategoryItems(summary, selection)

  const handleToggle = (key: string, checked: boolean) =>
    setSelection((prev) => ({ ...prev, [key]: checked }))

  const handleExport = async () => {
    const destPath = await save({
      defaultPath: `${instance.name}.astropack`,
      filters: [{ name: 'AstroPack', extensions: ['astropack'] }],
    })
    if (!destPath || Array.isArray(destPath)) return

    setIsExporting(true)
    setExportCurrent(0)
    setExportTotal(0)
    setExportItemName('')
    try {
      const iconSrc = resolveIconSrc(instance.iconPath)
      const iconDataUri = iconSrc ? await iconToDataUri(iconSrc) : null
      await AstroPackAPI.exportInstance(
        instance.id,
        destPath,
        selection,
        iconDataUri,
      )
      onOpenChange(false)
    } catch (err) {
      toast.error(`Falha ao exportar: ${String(err)}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="size-5" />
            Exportar {instance.name}
          </DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground text-sm">
          Escolha o que vai junto no .astropack.
        </p>

        {isExporting ? (
          <ProgressGroup
            label={exportItemName || 'Preparando...'}
            value={exportTotal > 0 ? (exportCurrent / exportTotal) * 100 : 0}
            rightLabel={
              exportTotal > 0 ? `${exportCurrent}/${exportTotal}` : undefined
            }
          />
        ) : summary ? (
          <AstroPackCategoryList items={items} onToggle={handleToggle} />
        ) : (
          <CenteredSpinner className="h-32" />
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !summary}>
            {isExporting && <Loader2 className="animate-spin" />}
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
