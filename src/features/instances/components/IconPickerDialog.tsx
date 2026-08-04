import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import { Plus, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { SearchInput } from '@/components/common/SearchInput'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MC_BLOCK_ICONS, MC_ITEM_ICONS } from '@/data/mc-icons'
import { resolveIconSrc } from '@/lib/icon-src'
import { tooltipProps } from '@/lib/tooltip'

import type { CustomIconDTO } from '../services/custom-icon.api'
import { CustomIconAPI } from '../services/custom-icon.api'

interface IconPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (iconPath: string) => void
}

const OUTPUT_SIZE = 128

function mimeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  return 'image/png'
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem'))
    img.src = src
  })
}

async function cropToBase64Png(
  imageSrc: string,
  cropPixels: Area,
): Promise<string> {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  )
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
}

function PresetGrid({
  icons,
  search,
  onPick,
}: {
  icons: typeof MC_BLOCK_ICONS
  search: string
  onPick: (path: string) => void
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return icons
    return icons.filter((icon) => icon.label.toLowerCase().includes(q))
  }, [icons, search])

  return (
    <ScrollArea className="h-72">
      <div className="grid grid-cols-6 gap-2 pr-3">
        {filtered.map((icon) => (
          <button
            key={icon.id}
            type="button"
            {...tooltipProps(icon.label)}
            onClick={() => onPick(icon.path)}
            className="bg-muted hover:border-primary hover:bg-accent flex aspect-square items-center justify-center rounded-md border border-transparent p-2 transition-colors"
          >
            <img
              src={icon.path}
              alt={icon.label}
              loading="lazy"
              className="size-full [image-rendering:pixelated]"
            />
          </button>
        ))}
        {filtered.length === 0 && (
          <EmptyState
            title="Nenhum ícone encontrado."
            className="col-span-6 p-4"
          />
        )}
      </div>
    </ScrollArea>
  )
}

export function IconPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: IconPickerDialogProps) {
  const [search, setSearch] = useState('')
  const [customIcons, setCustomIcons] = useState<CustomIconDTO[]>([])
  const [uploadSrc, setUploadSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!open) return
    CustomIconAPI.list()
      .then(setCustomIcons)
      .catch((err) => toast.error(`Falha ao carregar uploads: ${String(err)}`))
  }, [open])

  const resetUpload = () => {
    setUploadSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetUpload()
      setSearch('')
    }
    onOpenChange(next)
  }

  const handlePickPreset = (path: string) => {
    onSelect(path)
    handleOpenChange(false)
  }

  const handlePickCustom = (icon: CustomIconDTO) => {
    onSelect(icon.path)
    handleOpenChange(false)
  }

  const handleDeleteCustom = async (icon: CustomIconDTO, e: MouseEvent) => {
    e.stopPropagation()
    try {
      await CustomIconAPI.delete(icon.id)
      setCustomIcons((prev) => prev.filter((i) => i.id !== icon.id))
    } catch (err) {
      toast.error(`Falha ao remover imagem: ${String(err)}`)
    }
  }

  const handleChooseFile = async () => {
    const filePath = await openFileDialog({
      multiple: false,
      filters: [
        { name: 'Imagem', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] },
      ],
    })
    if (!filePath || Array.isArray(filePath)) return
    try {
      const bytes = await readFile(filePath)
      setUploadSrc(`data:${mimeFor(filePath)};base64,${bytesToBase64(bytes)}`)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    } catch (err) {
      toast.error(`Falha ao carregar imagem: ${String(err)}`)
    }
  }

  const handleConfirmCrop = async () => {
    if (!uploadSrc || !croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const base64Png = await cropToBase64Png(uploadSrc, croppedAreaPixels)
      const saved = await CustomIconAPI.save(base64Png)
      setCustomIcons((prev) => [saved, ...prev])
      resetUpload()
    } catch (err) {
      toast.error(`Falha ao salvar imagem: ${String(err)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Escolher ícone</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="blocks">
          <TabsList>
            <TabsTrigger value="blocks">Blocos</TabsTrigger>
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="upload">Meus uploads</TabsTrigger>
          </TabsList>

          <TabsContent value="blocks" className="flex flex-col gap-3">
            <SearchInput
              placeholder="Buscar blocos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <PresetGrid
              icons={MC_BLOCK_ICONS}
              search={search}
              onPick={handlePickPreset}
            />
          </TabsContent>

          <TabsContent value="items" className="flex flex-col gap-3">
            <SearchInput
              placeholder="Buscar itens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <PresetGrid
              icons={MC_ITEM_ICONS}
              search={search}
              onPick={handlePickPreset}
            />
          </TabsContent>

          <TabsContent value="upload" className="flex flex-col gap-3">
            {uploadSrc ? (
              <>
                <div className="bg-muted relative h-64 w-full overflow-hidden rounded-lg">
                  <Cropper
                    image={uploadSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="rect"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_area, pixels) =>
                      setCroppedAreaPixels(pixels)
                    }
                  />
                </div>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.01}
                  onValueChange={([v]) => setZoom(v)}
                />
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={resetUpload}>
                    Escolher outra imagem
                  </Button>
                  <Button onClick={handleConfirmCrop} disabled={isProcessing}>
                    {isProcessing ? 'Salvando...' : 'Salvar imagem'}
                  </Button>
                </div>
              </>
            ) : (
              <ScrollArea className="h-72">
                <div className="grid grid-cols-6 gap-2 pt-2 pr-3">
                  <button
                    type="button"
                    onClick={handleChooseFile}
                    className="border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary flex aspect-square items-center justify-center rounded-md border border-dashed transition-colors"
                  >
                    <Plus className="size-5" />
                  </button>
                  {customIcons.map((icon) => (
                    <div key={icon.id} className="group relative aspect-square">
                      <button
                        type="button"
                        onClick={() => handlePickCustom(icon)}
                        className="bg-muted hover:border-primary hover:bg-accent flex size-full items-center justify-center rounded-md border border-transparent p-2 transition-colors"
                      >
                        <img
                          src={resolveIconSrc(icon.path)}
                          alt=""
                          className="size-full rounded-sm object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustom(icon, e)}
                        className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full group-hover:flex"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {customIcons.length === 0 && (
                    <p className="text-muted-foreground col-span-5 flex items-center p-4 text-sm">
                      Nenhuma imagem enviada ainda.
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
