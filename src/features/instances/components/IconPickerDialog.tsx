import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import type { MouseEvent } from 'react'
import { useEffect, useState } from 'react'
import type { Area } from 'react-easy-crop'
import { toast } from 'sonner'

import { SearchInput } from '@/components/common/SearchInput'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MC_BLOCK_ICONS, MC_ITEM_ICONS } from '@/data/mc-icons'

import type { CustomIconDTO } from '../services/custom-icon.api'
import { CustomIconAPI } from '../services/custom-icon.api'
import { bytesToBase64, cropToBase64Png, mimeFor } from './icon-crop'
import { IconPresetGrid } from './IconPresetGrid'
import { IconUploadTab } from './IconUploadTab'

interface IconPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (iconPath: string) => void
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
            <IconPresetGrid
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
            <IconPresetGrid
              icons={MC_ITEM_ICONS}
              search={search}
              onPick={handlePickPreset}
            />
          </TabsContent>

          <TabsContent value="upload" className="flex flex-col gap-3">
            <IconUploadTab
              uploadSrc={uploadSrc}
              crop={crop}
              setCrop={setCrop}
              zoom={zoom}
              setZoom={setZoom}
              onCropComplete={setCroppedAreaPixels}
              isProcessing={isProcessing}
              customIcons={customIcons}
              onChooseFile={handleChooseFile}
              onConfirmCrop={handleConfirmCrop}
              onResetUpload={resetUpload}
              onPickCustom={handlePickCustom}
              onDeleteCustom={handleDeleteCustom}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
