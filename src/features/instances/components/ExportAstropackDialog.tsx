import { save } from '@tauri-apps/plugin-dialog'
import { Loader2, PackageCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { resolveIconSrc } from '@/lib/icon-src'
import type { InstanceDTO } from '@/types/instance'

import { AstroPackCategoryList, type AstroPackCategoryItem } from './AstroPackCategoryList'
import { ALL_SELECTED, AstroPackAPI, type ExportSelection, type ExportSummary } from '../services/astropack.api'

async function iconToDataUri(src: string): Promise<string | null> {
  try {
    const response = await fetch(src)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Falha ao ler ícone'))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

interface ExportAstropackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance: InstanceDTO
}

export function ExportAstropackDialog({ open, onOpenChange, instance }: ExportAstropackDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [summary, setSummary] = useState<ExportSummary | null>(null)
  const [selection, setSelection] = useState<ExportSelection>(ALL_SELECTED)

  // Clear the previous summary during render when the dialog reopens (the
  // effect below only performs the fetch).
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open) setSummary(null)
  }

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

  const items: AstroPackCategoryItem[] = summary
    ? [
        { key: 'settings', label: 'Configurações do jogo (options.txt)', count: summary.hasSettings, checked: selection.settings },
        { key: 'worlds', label: 'Mundos', count: summary.worlds, checked: selection.worlds },
        { key: 'notes', label: 'Notas', count: summary.hasNotes, checked: selection.notes },
        { key: 'mods', label: 'Mods', count: summary.mods, checked: selection.mods },
        { key: 'resourcepacks', label: 'Resource Packs', count: summary.resourcepacks, checked: selection.resourcepacks },
        { key: 'shaders', label: 'Shader Packs', count: summary.shaders, checked: selection.shaders },
        { key: 'servers', label: 'Servidores salvos', count: summary.servers, checked: selection.servers },
        { key: 'screenshots', label: 'Screenshots', count: summary.screenshots, checked: selection.screenshots },
      ]
    : []

  const handleToggle = (key: string, checked: boolean) => setSelection((prev) => ({ ...prev, [key]: checked }))

  const handleExport = async () => {
    const destPath = await save({
      defaultPath: `${instance.name}.astropack`,
      filters: [{ name: 'AstroPack', extensions: ['astropack'] }],
    })
    if (!destPath || Array.isArray(destPath)) return

    setIsExporting(true)
    try {
      const iconSrc = resolveIconSrc(instance.iconPath)
      const iconDataUri = iconSrc ? await iconToDataUri(iconSrc) : null
      const result = await AstroPackAPI.exportInstance(instance.id, destPath, selection, iconDataUri)
      toast.success(`Instância exportada para ${result.filePath}`)
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

        <p className="text-sm text-muted-foreground">Escolha o que vai junto no .astropack.</p>

        {summary ? <AstroPackCategoryList items={items} onToggle={handleToggle} /> : <CenteredSpinner className="h-32" />}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
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
